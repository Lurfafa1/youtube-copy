# Use an official Node.js image as base (adjust if you're using a different runtime)
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your backend listens on (for example, 5000)
EXPOSE 5000

# Start the backend service (adjust the command as needed)
CMD ["npm", "start"]
