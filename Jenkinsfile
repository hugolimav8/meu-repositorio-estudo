pipeline {
    agent any

    // Define os gatilhos diretamente no código (sincroniza com a interface do Jenkins)
    triggers {
        pollSCM('* * * * *') // Verifica alterações no Git a cada minuto
    }

    environment {
        REPO_URL   = 'https://github.com/hugolimav8/meu-repositorio-estudo.git'
        IMAGE_NAME = 'api-pagamentos'
        // Em produção, usamos o ID do build para criar uma tag única e permitir rollback
        IMAGE_TAG  = "${BUILD_NUMBER}" 
    }

    stages {
        stage('Checkout') {
            steps {
                // Mantém o comportamento original, mas garante o mapeamento correto do repositório
                git branch: 'main', url: "${REPO_URL}"
            }
        }

        stage('Build Image') {
            steps {
                // Build da imagem usando a pasta correta e aplicando a tag dinâmica do build atual
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ./api-pagamentos"
                // Cria também uma tag estável local como referência secundária
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy & Auto-Validation') {
            steps {
                script {
                    echo "--- Iniciando Deploy Nível Produção ---"

                    // 1. Identifica a TAG que está rodando agora para o caso de precisar voltar atrás
                    env.OLD_TAG = sh(script: "docker inspect --format='{{.Config.Image}}' api-pagamentos-prod | cut -d':' -f2 || echo ''", returnStdout: true).trim()
                    
                    // 2. Se for a primeira execução ou não encontrar o container, sobe o container do zero
                    def containerExists = sh(script: "docker ps -a --format '{{.Names}}' | grep -w api-pagamentos-prod || true", returnStdout: true).trim()

                    if (containerExists == "") {
                        echo "Primeiro deploy detectado. Iniciando container original..."
                        sh "docker run -d --name api-pagamentos-prod -p 3000:3000 ${IMAGE_NAME}:${IMAGE_TAG}"
                    } else {
                        echo "Versão anterior em execução encontrada (Tag: ${env.OLD_TAG}). Aplicando estratégia de atualização segura."
                        
                        // 3. Em vez de deletar o antigo, subimos o novo em paralelo em uma porta temporária de teste (3001)
                        // Isso garante que o serviço na porta 3000 continue respondendo aos clientes durante o deploy
                        sh "docker run -d --name api-pagamentos-prod-new -p 3001:3000 ${IMAGE_NAME}:${IMAGE_TAG}"

                        // 4. Aguarda e valida se a nova versão está realmente saudável (Health Check Loop)
                        echo "Aguardando inicialização e validação da rota /health..."
                        
                        def healthCheck = "000"
                        // Tenta 3 vezes, esperando 5 segundos entre cada tentativa (total 15s) para dar tempo do Node subir
                        for (int i = 0; i < 3; i++) {
                            sleep 5
                            echo "Tentativa de validação ${i+1} de 3..."
                            // Usamos o IP de gateway do Docker 172.17.0.1 para fazer a requisição sair do container do Jenkins e chegar ao Host roma
                            healthCheck = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://172.17.0.1:3001/health || echo '000'", returnStdout: true).trim()
                            
                            if (healthCheck == "200") {
                                break
                            }
                        }

                        if (healthCheck == "200") {
                            echo "✅ Nova versão validada com sucesso! Substituindo tráfego em produção..."
                            
                            // Agora sim, com a certeza de que o novo funciona, removemos o antigo e viramos a porta principal
                            sh "docker stop api-pagamentos-prod || true"
                            sh "docker rm api-pagamentos-prod || true"
                            
                            sh "docker stop api-pagamentos-prod-new || true"
                            sh "docker rm api-pagamentos-prod-new || true"

                            // Sobe a versão definitiva na porta 3000
                            sh "docker run -d --name api-pagamentos-prod -p 3000:3000 ${IMAGE_NAME}:${IMAGE_TAG}"
                            echo "🚀 Deploy finalizado com sucesso absoluto."
                        } else {
                            // Se o status da rota não for 200, força a interrupção para disparar o bloco de falha (Rollback)
                            sh "docker stop api-pagamentos-prod-new || true"
                            sh "docker rm api-pagamentos-prod-new || true"
                            error("Falha na validação automatizada: A API respondeu com status HTTP ${healthCheck}")
                        }
                    }
                }
            }
        }
    }

    post {
        failure {
            script {
                echo "🚨 DETECTADA FALHA NO DEPLOY OU NA VALIDAÇÃO!"
                echo "Iniciando Rollback Automático para mitigar impacto..."
                
                if (env.OLD_TAG != "") {
                    echo "Restaurando ambiente estável anterior com a Tag: ${env.OLD_TAG}"
                    
                    sh "docker stop api-pagamentos-prod || true"
                    sh "docker rm api-pagamentos-prod || true"
                    
                    // Garante o retorno da versão estável que estava rodando antes de iniciar o deploy atual
                    sh "docker run -d --name api-pagamentos-prod -p 3000:3000 ${IMAGE_NAME}:${env.OLD_TAG}"
                    
                    echo "✅ Rollback executado com sucesso. Produção reestabelecida."
                } else {
                    echo "❌ Não foi possível determinar uma versão anterior estável para realizar o rollback."
                }
            }
        }
        always {
            echo "Limpando resíduos de build do servidor roma..."
            sh "docker image prune -f"
        }
    }
}
