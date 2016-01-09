# RentMojo

Share items among your friends.

### Docker Commands
 - docker build -t rentmojo:v1 .
 - docker run -it -p 9180:8080 --name rabta rentmojo:v1 
 - In second terminal  type
  - docker exec -it rentmojo:v1 bash
  - git clone https://gitlab.com/rabta/rentmojo.git
  - cd rentmojo
  - npm install
  - npm start