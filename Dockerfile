# Use the official Node.js image as the base image
FROM node:18.16.1-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

RUN npm run build

# Expose the port on which the application will run
EXPOSE 3004

# Setup debug env
# ENV DEBUG=*
# Set the command to run the application when the container starts
# CMD [ "npm", "run", "start" ]

CMD [ "node", "dist/main.js" ]
