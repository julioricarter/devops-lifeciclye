# Copiar a terraform.tfvars y ajustar valores
aws_region         = "us-east-1"
project_name       = "devops-demo"
environment        = "staging"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets    = ["10.0.11.0/24", "10.0.12.0/24"]
eks_cluster_version = "1.29"
node_instance_type  = "t3.medium"
node_min_size       = 1
node_max_size       = 3
node_desired_size   = 2
