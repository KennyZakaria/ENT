# Use Nginx base image
FROM nginx:alpine

# Copy frontend files
COPY . /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 2000

# Nginx will start automatically
