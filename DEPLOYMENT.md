
# Lyfe Personal Scribe - Docker Deployment Guide

This guide will help you deploy the Lyfe Personal Scribe application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)
- Git (to clone the repository)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd lyfe-personal-scribe
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the root directory with your Supabase configuration:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

## Manual Docker Commands

If you prefer to use Docker commands directly:

1. **Build the image**
   ```bash
   docker build -t lyfe-scribe .
   ```

2. **Run the container**
   ```bash
   docker run -d -p 3000:80 --name lyfe-scribe-app lyfe-scribe
   ```

## Configuration

### Environment Variables

The application requires the following environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Port Configuration

By default, the application runs on port 3000. To change this:

1. **With Docker Compose**: Edit the `docker-compose.yml` file and change the ports mapping
2. **With Docker CLI**: Change the port mapping in the `docker run` command

## Production Deployment

### Using a Custom Domain

1. Update the nginx configuration if needed
2. Set up SSL/TLS certificates (recommended: Let's Encrypt)
3. Configure your reverse proxy or load balancer

### Environment-Specific Builds

For different environments, you can create environment-specific Docker Compose files:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Use a different port
   docker run -d -p 8080:80 lyfe-scribe
   ```

2. **Build fails**
   - Ensure you have sufficient disk space
   - Check that all dependencies are properly listed in package.json
   - Clear Docker cache: `docker system prune -a`

3. **Application not loading**
   - Check container logs: `docker logs lyfe-scribe-app`
   - Verify environment variables are set correctly
   - Ensure Supabase configuration is correct

### Logs

To view application logs:
```bash
# With Docker Compose
docker-compose logs -f

# With Docker CLI
docker logs -f lyfe-scribe-app
```

## Updating the Application

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Backup and Maintenance

### Database Backup
Since this application uses Supabase, your data is managed externally. Ensure you have:
- Regular Supabase backups configured
- Environment variables backed up securely

### Container Maintenance
```bash
# Remove old images
docker image prune -a

# Update base images
docker-compose pull
docker-compose up -d
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **SSL/TLS**: Always use HTTPS in production
3. **Updates**: Regularly update the base Docker images
4. **Access Control**: Implement proper firewall rules

## Support

For issues related to:
- Application features: Check the main README.md
- Docker deployment: Review this guide and check container logs
- Supabase integration: Refer to Supabase documentation

## Features Available

Once deployed, you can access:
- **Dashboard**: Main landing page with transcription tools
- **Tasks**: Kanban board with calendar view for task scheduling
- **Notes**: Personal note-taking system
- **Admin Panel**: User management (for super admins)

Navigate between these features using the menu in the application header.
