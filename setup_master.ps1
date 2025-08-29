# Script para configurar usuario Master automaticamente
Write-Host "Configurando usuario Master..." -ForegroundColor Green

# 1. Criar usuario Master
Write-Host "Criando usuario Master..." -ForegroundColor Yellow
$userResult = npx convex run users:create (Get-Content temp_user.json -Raw)
Write-Host "Usuario Master criado: $userResult" -ForegroundColor Green

# 2. Criar CNPJ
Write-Host "Criando CNPJ..." -ForegroundColor Yellow
$cnpjResult = npx convex run cnpjs:createCnpj (Get-Content temp_cnpj.json -Raw)
Write-Host "CNPJ criado: $cnpjResult" -ForegroundColor Green

# 3. Vincular usuario ao CNPJ
Write-Host "Vinculando usuario ao CNPJ..." -ForegroundColor Yellow
$linkData = @{
    userId = "temp_master"
    cnpjId = $cnpjResult
    role = "admin"
    masterUserId = "temp_master"
} | ConvertTo-Json

$linkResult = npx convex run cnpjs:linkUserToCnpj $linkData
Write-Host "Usuario vinculado ao CNPJ: $linkResult" -ForegroundColor Green

Write-Host "Configuracao concluida com sucesso!" -ForegroundColor Green
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Faca login com pedrinhocornetti@gmail.com" -ForegroundColor White
Write-Host "   2. Descubra seu ID do Clerk no console do navegador" -ForegroundColor White
Write-Host "   3. Execute: npx convex run cnpjs:updateMasterUserClerkId '{\"email\":\"pedrinhocornetti@gmail.com\",\"clerkId\":\"SEU_ID_AQUI\"}'" -ForegroundColor White

# Limpar arquivos temporarios
Remove-Item temp_user.json
Remove-Item temp_cnpj.json
Write-Host "Arquivos temporarios removidos" -ForegroundColor Gray
