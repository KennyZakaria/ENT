# Course Download Portal Frontend

A simple HTML and JavaScript frontend for interacting with the Course Download Service.

## Overview

This frontend application provides a user interface for students to:

1. Authenticate with Keycloak
2. View available courses
3. Download course materials

## Features

- **Authentication**: Secure login using Keycloak OAuth2
- **Course Listing**: Display all available courses for the authenticated student
- **File Downloads**: Generate and use pre-signed URLs to download course materials
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. Ensure the download service is running (port 8002)
2. Ensure Keycloak is running (port 8080)
3. Open the `index.html` file in a web browser or serve it using a simple HTTP server

## Configuration

The frontend is configured to connect to:

- Keycloak at `http://localhost:8080`
- Download Service at `http://localhost:8002`

You can modify these settings in the `app.js` file if your services are running on different ports or hosts.

## Usage

1. Enter your Keycloak username and password
2. Browse the list of available courses
3. Click the "Download" button to download course materials

## Security Notes

- Authentication is handled via Keycloak OAuth2
- The frontend stores the authentication token in localStorage
- All API requests include the Bearer token for authorization
- CORS is enabled on the backend to allow requests from the frontend