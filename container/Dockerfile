# if on Apple M chips, use the platform prefix!
# explanation: https://stackoverflow.com/questions/65612411/forcing-docker-to-use-linux-amd64-platform-by-default-on-macos/69636473#69636473
FROM --platform=linux/amd64 node:20

WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy transpiled files
COPY ./build ./build

EXPOSE 80

CMD ["node", "build/index.js"]

# https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
# How to push the image to the ECR:
# 1. Authorize your docker to push to the ECR repository
# aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
# ^ replace <REGION> and <ACCOUNT_ID>
# 2. tag the image:
# docker tag my-node-app <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/<REPOSITORY_NAME>
# <REPOSITORY_NAME> can be found in the CDK stack
# 3. Push the image:
# docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/<REPOSITORY_NAME>
