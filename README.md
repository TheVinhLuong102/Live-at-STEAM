# Live-STEAM

## Auto deployment instructions:

Currently, our app is configured to deploy to production with every changes on master
1. Build a docker package and host it on github registry.
2. SSH to the droplet and pull the package from github & run it on port 3600
3. There is a Nginx server that proxy the requests to port 3600


See the `.github/workflows/deploy.yml` for the build steps and `Dockerfile` for docker build steps


## Manual deployment instructions (unused):

1. Install docker-machine following [this guide](https://docs.docker.com/machine/install-machine/)
2. Copy docker machine config to your laptop

TODO: share this config some where.

3. Double-check that docker-machine recognize the droplet config
```
docker-machine env live-steam
```

4. Run following command to switch to the droplet host
```
eval $(docker-machine env live-steam)
```

5. Build the code & deploy
```
# build a new image
docker build --no-cache -t live-steam:prod .

# remove existing container
docker rm --force live-steam

# run the new build
docker run -d -p 80:3600 --name live-steam live-steam:prod
```

See: https://scotch.io/tutorials/how-to-host-a-node-js-app-on-digital-ocean#toc-docker-machine-approach
