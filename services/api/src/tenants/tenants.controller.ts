import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";

/**
 * Tenants controller
 * Handles league/tenant CRUD operations
 */
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }
}

