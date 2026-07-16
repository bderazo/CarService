# MecanicApp - Sistema de Gestión para Taller Mecánico

Sistema desarrollado con **ASP.NET Core** y **Angular** basado en el framework **ABP** (ASP.NET Boilerplate).

## 📋 Requisitos del Sistema

### Software necesario

| Herramienta | Versión mínima | Enlace de descarga |
|-------------|---------------|-------------------|
| .NET SDK | 10.0+ | [Descargar .NET](https://dotnet.microsoft.com/download/dotnet) |
| Node.js | v20.11+ | [Descargar Node.js](https://nodejs.org/) |
| SQL Server | 2022+ | [Descargar SQL Server Express](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) |
| ABP CLI | Última versión | Instalación automática (ver abajo) |

### Verificar instalaciones

```bash
# Verificar .NET
dotnet --version

# Verificar Node.js
node --version
npm --version

# Instalar/Actualizar ABP CLI
dotnet tool install -g Volo.Abp.Cli
# o para actualizar
dotnet tool update -g Volo.Abp.Cli

🗂️ Estructura del Proyecto
CarService/
├── angular/                          # Frontend - Aplicación Angular
│   ├── src/
│   └── README.md
├── aspnet-core/                      # Backend - API ASP.NET Core
│   ├── src/
│   │   ├── MecanicApp.Application/
│   │   ├── MecanicApp.Application.Contracts/
│   │   ├── MecanicApp.DbMigrator/       # Migraciones de Base de Datos
│   │   ├── MecanicApp.Domain/
│   │   ├── MecanicApp.Domain.Shared/
│   │   ├── MecanicApp.EntityFrameworkCore/
│   │   ├── MecanicApp.HttpApi/
│   │   ├── MecanicApp.HttpApi.Client/
│   │   └── MecanicApp.HttpApi.Host/     # API Principal
│   ├── test/
│   └── README.md
└── README.md                        # Este archivo

🗄️ Configuración de Base de Datos
Cadena de conexión
El proyecto usa SQL Server. La cadena de conexión se configura en los archivos:

aspnet-core/src/MecanicApp.DbMigrator/appsettings.json

aspnet-core/src/MecanicApp.HttpApi.Host/appsettings.json

Formato de cadena de conexión:
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=MecanicApp;Trusted_Connection=True;TrustServerCertificate=True"
  }
}

Opciones de conexión alternativas
// SQL Server con autenticación de Windows
"Default": "Server=localhost;Database=MecanicApp;Trusted_Connection=True;TrustServerCertificate=True"

// SQL Server con autenticación SQL
"Default": "Server=localhost;Database=MecanicApp;User Id=sa;Password=TuContraseña;TrustServerCertificate=True"

// SQL Server LocalDB (desarrollo)
"Default": "Server=(LocalDb)\\MSSQLLocalDB;Database=MecanicApp;Trusted_Connection=True;TrustServerCertificate=True"

🚀 Instalación y Ejecución
1. Clonar el repositorio
git clone <url-del-repositorio>
cd CarService
2. Configurar el Backend
2.1 Restaurar paquetes NuGet
cd aspnet-core
dotnet restore
2.2 Configurar la base de datos
Asegúrate de que SQL Server esté corriendo:
# Verificar servicios de SQL Server
Get-Service | Where-Object {$_.Name -like "*SQL*"}
Edita los archivos de configuración si es necesario:
# Editar configuración del DbMigrator
notepad .\src\MecanicApp.DbMigrator\appsettings.json
# Editar configuración del HttpApi.Host
notepad .\src\MecanicApp.HttpApi.Host\appsettings.json
2.3 Crear la base de datos y aplicar migraciones
cd src\MecanicApp.DbMigrator
dotnet run
Este proceso:
Crea la base de datos MecanicApp
Aplica todas las migraciones
Inserta los datos iniciales (seed data)
2.4 Instalar librerías cliente (si es necesario)
# Desde la raíz del backend (aspnet-core)
abp install-libs
3. Configurar el Frontend
Abre una nueva terminal:
cd CarService/angular
npm install
4. Ejecutar la aplicación
4.1 Iniciar el Backend (Terminal 1)
cd CarService/aspnet-core/src/MecanicApp.HttpApi.Host
dotnet run
✅ API corriendo en: https://localhost:44326
✅ Swagger disponible en: https://localhost:44326/swagger
4.2 Iniciar el Frontend (Terminal 2)
cd CarService/angular
npm start
✅ Aplicación Angular corriendo en: http://localhost:4200
5. Acceder a la aplicación
Abre tu navegador y navega a: http://localhost:4200
Credenciales por defecto
Campo	Valor
Usuario	admin
Contraseña	1q2w3E*

🔧 Solución de Problemas Comunes
Error de conexión a SQL Server
Síntoma: Error Number:2 - No se puede conectar al servidor SQL
Solución:
1. Verificar que SQL Server esté corriendo:
Get-Service MSSQLSERVER
2. Si está detenido, iniciarlo:
Start-Service MSSQLSERVER
3. Verificar la cadena de conexión en appsettings.json
Error de certificado SSL
Síntoma: Http failure response for https://localhost:44326/...
Solución:
dotnet dev-certs https --trust
Luego reiniciar el backend.
Error en el frontend
Síntoma: An error has occurred! Http failure response...
Soluciones:
1. Ejecutar en la raíz del backend:
abp install-libs
2. Limpiar caché de npm y reinstalar:
cd angular
npm cache clean --force
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
3. Reiniciar ambos servidores (backend y frontend)
.NET SDK no reconocido
Síntoma: El término 'dotnet' no se reconoce
Solución:
Descargar e instalar .NET SDK desde: https://dotnet.microsoft.com/download
Reiniciar la terminal
Verificar: dotnet --version
📦 Agregar Nuevos Módulos ABP
El proyecto está basado en ABP Framework, por lo que puedes agregar módulos adicionales:
# Listar módulos disponibles
abp list-modules
# Agregar módulos específicos
abp add-module Volo.Chat
abp add-module Volo.FileManagement
abp add-module Volo.Forms
Después de agregar un módulo:
1. Ejecutar migraciones: dotnet run en MecanicApp.DbMigrator
2. Actualizar frontend: npm install en angular
3. Reiniciar ambos servidores
🛠️ Tecnologías Utilizadas
Backend:
ASP.NET Core 10.0
ABP Framework
Entity Framework Core
SQL Server
OpenIddict (Autenticación)
Swagger (Documentación API)
Frontend:
Angular
Angular CLI
ABP Angular UI
LeptonX Lite Theme
📚 Recursos Adicionales
Documentación de ABP Framework
Tutorial de Desarrollo Web ABP
Documentación de Angular
Documentación de .NET

Desarrollado por: David Erazo
Última actualización: Junio 2026


---

Este README incluye:

✅ Requisitos detallados con enlaces  
✅ Estructura clara del proyecto  
✅ Pasos de instalación paso a paso  
✅ Configuración de base de datos  
✅ Solución de problemas comunes (basados en tu experiencia real)  
✅ Credenciales por defecto  
✅ Comandos para agregar módulos nuevos  
✅ URLs de acceso (frontend, backend, swagger)  

