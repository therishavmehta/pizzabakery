# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the app files to the working directory
COPY . .

ENV PORT=8080

# Expose the port that your app will run on
EXPOSE 8080

# Define the command to run the app
CMD ["npm", "start"]
