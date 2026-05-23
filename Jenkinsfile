pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build Image') {
            steps {
                // Build da imagem usando o Dockerfile da pasta api-pagamentos
                sh 'docker build -t api-pagamentos:latest ./api-pagamentos'
            }
        }
        stage('Deploy') {
            steps {
                script {
                    // Remove o container antigo e sobe o novo
                    sh 'docker stop api-pagamentos-prod || true'
                    sh 'docker rm api-pagamentos-prod || true'
                    sh 'docker run -d --name api-pagamentos-prod -p 3000:3000 api-pagamentos:latest'
                }
            }
        }
    }
}
