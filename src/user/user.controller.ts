import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user profile', description: 'Retrieve the current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getUserProfile(@Req() req: { user: JwtPayload }) {
    const user = await this.userService.findById(req.user.sub);
    return user;
  }
}
