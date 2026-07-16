using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MecanicApp.Migrations
{
    /// <inheritdoc />
    public partial class AddCamposProformaYOrdenTrabajo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cilindrada",
                table: "Vehiculos",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EspecificacionAveria",
                table: "OrdenesServicio",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoCarroceria",
                table: "OrdenesServicio",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEntrega",
                table: "OrdenesServicio",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FormaPago",
                table: "OrdenesServicio",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ValidezOferta",
                table: "OrdenesServicio",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cilindrada",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "EspecificacionAveria",
                table: "OrdenesServicio");

            migrationBuilder.DropColumn(
                name: "EstadoCarroceria",
                table: "OrdenesServicio");

            migrationBuilder.DropColumn(
                name: "FechaEntrega",
                table: "OrdenesServicio");

            migrationBuilder.DropColumn(
                name: "FormaPago",
                table: "OrdenesServicio");

            migrationBuilder.DropColumn(
                name: "ValidezOferta",
                table: "OrdenesServicio");
        }
    }
}
