# Research #4: Deploy to OCI from GitHub Actions

**Status**: Complete  
**Finding**: OIDC + OCIR + SSH deploy is the simplest path. Full guide below.

## Authentication: OIDC (Recommended)

**OCI now supports GitHub OIDC federation via Workload Identity Federation** (no static API keys needed):

1. Set up **Identity Propagation Trust Configuration** in OCI Identity Domain to trust GitHub
2. GitHub Actions automatically provides OIDC token via `${{ secrets.GITHUB_TOKEN }}`
3. Exchange JWT for short-lived OCI session token (no secrets to rotate)

**Fallback**: Static API key auth (store in GitHub Secrets, base64-encode private key)

## Container Registry: OCIR

**OCI Container Registry (OCIR)**:
- Region endpoint: `<region>.ocir.io`
- Username format: `<tenancy-namespace>/<username>` or `<tenancy-namespace>/oracleidentitycloudservice/<username>` (federated users)
- Auth: Use OCI User Auth Token (docker login, or GitHub Actions secret)
- Push with `docker/build-push-action@v6`

**Alternative**: GitHub Container Registry (GHCR) — simpler auth (uses built-in `GITHUB_TOKEN`)

## Compute Deployment

**Simplest Approach: SSH Deploy Script**
1. Store SSH private key in GitHub Secrets (base64-encoded)
2. Use `appleboy/ssh-action@master` marketplace action to:
   - SSH into OCI Compute instance
   - Pull Docker image from OCIR
   - Stop old container, start new container
   - Run health checks

**Other Options**:
- OCI CLI commands via Systems Manager Session (more complex)
- OCI DevOps Service (enterprise, overkill for MVP)

## Database Migrations

**Run before deploying app code:**
```yaml
- name: Run migrations
  run: npx node-migrate up
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Timing: After build/test, before new container deploy. Use same `DATABASE_URL` secret as app.

## Health Checks

**Simple curl-based:**
```yaml
- name: Health check
  run: |
    for i in {1..30}; do
      if curl -f http://${{ secrets.OCI_COMPUTE_IP }}:3000/health; then
        echo "Deployment successful"
        exit 0
      fi
      sleep 10
    done
    exit 1
```

Retries 30×, waits 10s between attempts.

## Staging vs. Production

**GitHub Environments:**
```yaml
deploy-staging:
  environment: staging
  # Auto-trigger on develop branch

deploy-production:
  environment: production
  needs: deploy-staging
  # Requires manual approval before running
```

**Separate resources:**
- Two compute instances (staging + prod)
- Two PostgreSQL databases or schemas
- Different OCIR image tags
- Environment-specific secrets per GitHub Environment

## Example Workflow (Pseudocode)

```yaml
name: Deploy to OCI

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      # Note: no tests in MVP per CLAUDE.md

  migrate:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx node-migrate up
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: migrate
    runs-on: ubuntu-latest
    environment: production
    steps:
      # Auth: OCI OIDC (if configured) or API key secrets
      - name: Authenticate to OCI (OIDC)
        uses: oracle-actions/configure-oci-sdk@v3
        with:
          config-file-source: instance_principal

      # Login to OCIR
      - name: Login to OCIR
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.OCIR_REGION }}.ocir.io
          username: ${{ secrets.OCIR_USERNAME }}
          password: ${{ secrets.OCIR_TOKEN }}

      # Build & push image
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: |
            ${{ secrets.OCIR_REGION }}.ocir.io/${{ secrets.OCIR_NAMESPACE }}/app:latest
            ${{ secrets.OCIR_REGION }}.ocir.io/${{ secrets.OCIR_NAMESPACE }}/app:${{ github.sha }}

      # Deploy via SSH
      - name: Deploy to OCI Compute (SSH)
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.OCI_COMPUTE_IP }}
          username: ubuntu  # or opc for Oracle Linux
          key: ${{ secrets.OCI_SSH_PRIVATE_KEY }}  # base64-encoded
          script: |
            docker pull ${{ secrets.OCIR_REGION }}.ocir.io/${{ secrets.OCIR_NAMESPACE }}/app:latest
            docker stop app || true
            docker rm app || true
            docker run -d --name app -p 3000:3000 \
              -e DATABASE_URL='${{ secrets.DATABASE_URL }}' \
              ${{ secrets.OCIR_REGION }}.ocir.io/${{ secrets.OCIR_NAMESPACE }}/app:latest

      # Health check
      - name: Health check
        run: |
          for i in {1..30}; do
            if curl -f http://${{ secrets.OCI_COMPUTE_IP }}:3000/health; then
              echo "Deployment successful"
              exit 0
            fi
            sleep 10
          done
          exit 1
```

## Gotchas & Common Mistakes

1. **SSH Key Format**: OCI requires SSH keys (no password auth). Default usernames:
   - Ubuntu: `ubuntu`
   - Oracle Linux: `opc`

2. **OCIR Username Format**: Easy to mess up — must include tenancy namespace:
   - ❌ `myuser@example.com`
   - ✅ `tenancy-namespace/myuser@example.com`

3. **Network Security Lists**: Ensure OCI security lists allow:
   - Outbound HTTPS (image pulls from OCIR)
   - Inbound on app port (3000)
   - Outbound to PostgreSQL (port 5432) if in different subnet

4. **Base64 SSH Keys**: Encode private key before storing in GitHub Secrets, decode in workflow:
   ```yaml
   echo "${{ secrets.OCI_SSH_PRIVATE_KEY }}" | base64 -d > ~/.ssh/id_rsa
   ```

5. **Database URL Format**: Ensure PostgreSQL connection string is correct for your instance (internal VCN endpoint or public IP + firewall rules)

6. **Reduced GITHUB_TOKEN Permissions**: Forked PRs have limited permissions — deployment jobs may fail

## Simplest Path (Recommended for MVP)

1. ✅ Use GitHub OIDC + OCI (no static secrets)
2. ✅ Push to OCIR (native OCI registry)
3. ✅ Deploy via SSH (simplest, most reliable)
4. ✅ Run migrations before deploy (separate job)
5. ✅ Use GitHub Environments (staging auto, prod manual approval)
6. ✅ Simple curl health checks (no complex monitoring initially)

## Sources

- [OCI OIDC & GitHub Actions](https://www.ateam-oracle.com/github-actions-oci-a-guide-to-secure-oidc-token-exchange)
- [OCI Container Registry Auth](https://www.ateam-oracle.com/authentication-mechanisms-for-oci-container-registry-ocir)
- [OCI CI/CD with GitHub Actions & DevOps](https://docs.oracle.com/en/solutions/cicd-pipe-github-act-oci-devops/index.html)
- [Docker Build & Push GitHub Action](https://docs.docker.com/guides/nodejs/configure-github-actions/)
- [Adventures in CI/CD: OCI CLI Deployment](https://blogs.oracle.com/developers/adventures-in-cicd-4-deploying-a-microservice-to-the-oracle-cloud-with-github-actions-oci-cli-edition)
