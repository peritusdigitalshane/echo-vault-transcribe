
# Lyfe Personal Scribe - Docker Deployment Guide

This guide will help you deploy the Lyfe Personal Scribe application using Docker with pre-configured Supabase settings.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)
- Git (to clone the repository)

## Quick Start (No Configuration Required!)

The application comes pre-configured with Supabase settings - no environment variables needed!

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd lyfe-personal-scribe
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   
   Open your browser and navigate to: `http://localhost:2999`

That's it! The application will automatically connect to the configured Supabase instance.

## Manual Docker Commands

If you prefer to use Docker commands directly:

1. **Build the image**
   ```bash
   docker build -t lyfe-scribe .
   ```

2. **Run the container**
   ```bash
   docker run -d -p 2999:80 --name lyfe-scribe-app lyfe-scribe
   ```

## Nginx Proxy Manager Integration

This application is designed to work seamlessly with nginx proxy manager:

1. **Deploy the application** (it will be available on port 2999)
2. **Configure nginx proxy manager** to proxy your domain to `http://your-server-ip:2999`
3. **Set up SSL** through nginx proxy manager for your domain

The application includes:
- ✅ Production-ready nginx configuration
- ✅ Gzip compression for better performance  
- ✅ Static asset caching (1 year)
- ✅ Client-side routing support (SPA)
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- ✅ Health monitoring

## Production Deployment

### Using a Custom Domain

1. Deploy the container: `docker-compose up -d`
2. Configure nginx proxy manager to point to your server's IP:2999
3. Set up SSL/TLS certificates through nginx proxy manager
4. Your application will be available at your custom domain with HTTPS

### Environment-Specific Builds

For different environments:

```bash
# Development (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production (optimised)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## System Configuration

The application includes pre-configured system settings:

- **OpenAI Model**: whisper-1 (for transcription)
- **Max File Size**: 25MB for audio uploads
- **Allowed File Types**: MP3, WAV, MP4, M4A, WebM
- **Transcription Timeout**: 5 minutes
- **Email Notifications**: Disabled by default

Super admins can modify these settings through the admin panel once logged in.

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 2999
   lsof -i :2999
   
   # Use a different port
   docker run -d -p 8080:80 lyfe-scribe
   ```

2. **Build fails**
   - Ensure you have sufficient disk space
   - Check that all dependencies are properly listed in package.json
   - Clear Docker cache: `docker system prune -a`

3. **Application not loading**
   ```bash
   # Check container logs
   docker-compose logs -f
   
   # Check container health
   docker ps
   ```

4. **Database connection issues**
   - The application uses a pre-configured Supabase instance
   - Check the logs for any authentication or connection errors
   - Ensure your server has internet connectivity to reach Supabase

### Health Monitoring

The container includes health checks:
```bash
# Check container health status
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' lyfe-scribe-app
```

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

### Application Data
The application data is stored in Supabase (cloud-hosted), so no local backups are needed for data.

### Container Maintenance
```bash
# Remove old images
docker image prune -a

# Update base images
docker-compose pull
docker-compose up -d
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production (configure through nginx proxy manager)
2. **Firewall**: Ensure only necessary ports are exposed
3. **Updates**: Regularly update the application and base Docker images
4. **Access Control**: Configure proper user roles through the admin panel

## Features Available

Once deployed, you can access:

- **Dashboard**: Main landing page with transcription tools
- **Tasks**: Kanban board with calendar view for task scheduling  
- **Notes**: Personal note-taking system
- **Admin Panel**: User management (for super admins)

Navigate between these features using the menu in the application header.

## Default Super Admin

The system will automatically create a super admin account on first deployment. Check the application logs for the default credentials, or create your first super admin through the registration process.

## Support

For issues related to:
- **Application features**: Check this deployment guide and application logs
- **Docker deployment**: Review container logs and health status
- **Nginx proxy manager**: Ensure correct proxy configuration to port 2999
- **Database issues**: Check Supabase connectivity and authentication

The application is designed to be maintenance-free once deployed, with all configuration handled automatically.
