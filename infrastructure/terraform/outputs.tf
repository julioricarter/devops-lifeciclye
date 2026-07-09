output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.compute.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint URL of the EKS cluster"
  value       = module.compute.cluster_endpoint
  sensitive   = true
}

output "kubeconfig_command" {
  description = "Command to update local kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.compute.cluster_name}"
}
