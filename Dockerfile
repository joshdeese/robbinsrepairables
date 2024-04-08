FROM node:20.11.1

# Install the latest Chrome dev package and necessary fonts and libraries
RUN apt-get update \
  && apt-get install -y chromium\
  fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends

# Switch to the non-root user
USER node
RUN mkdir /home/node/app

# Set the working directory
WORKDIR /home/node/app

# Copy package.json and package-lock.json
COPY --chown=node package*.json ./

# Update the PUPPETEER_EXECUTABLE_PATH to the correct Chrome path (placeholder, update based on the output of `which google-chrome-stable`)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Install Puppeteer without downloading bundled Chromium
RUN npm install

# Copy your Puppeteer script into the Docker image
COPY --chown=node . /home/node/app

# Set the command to run your Puppeteer script
CMD ["node", "main.js"]
