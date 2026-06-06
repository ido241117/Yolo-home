import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ExceptionResponseBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  details?: unknown;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error, details } = this.normalizeException(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${message}`);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      const normalized = this.normalizeHttpResponse(body, statusCode);

      return {
        statusCode,
        ...normalized,
      };
    }

    const fallbackMessage =
      exception instanceof Error && exception.message ? exception.message : 'Có lỗi xảy ra, vui lòng thử lại sau';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: this.statusToErrorLabel(HttpStatus.INTERNAL_SERVER_ERROR),
      message: this.translateMessage(fallbackMessage),
    };
  }

  private normalizeHttpResponse(
    body: string | ExceptionResponseBody,
    statusCode: number,
  ): {
    message: string;
    error: string;
    details?: unknown;
  } {
    if (typeof body === 'string') {
      return {
        error: this.statusToErrorLabel(statusCode),
        message: this.translateMessage(body),
      };
    }

    const responseBody = body ?? {};
    const rawMessage = responseBody.message;
    const translatedError = this.translateMessage(responseBody.error ?? this.statusToErrorLabel(statusCode));

    if (Array.isArray(rawMessage)) {
      const translatedMessages = rawMessage.map((item) => this.translateMessage(String(item)));
      return {
        error: translatedError,
        message: translatedMessages[0] ?? translatedError,
        details: translatedMessages.length > 1 ? translatedMessages : undefined,
      };
    }

    const message =
      typeof rawMessage === 'string'
        ? this.translateMessage(rawMessage)
        : this.defaultMessageByStatus(statusCode);

    return {
      error: translatedError,
      message,
      details: responseBody.details,
    };
  }

  private statusToErrorLabel(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Yêu cầu không hợp lệ';
      case HttpStatus.UNAUTHORIZED:
        return 'Không được xác thực';
      case HttpStatus.FORBIDDEN:
        return 'Không có quyền truy cập';
      case HttpStatus.NOT_FOUND:
        return 'Không tìm thấy';
      case HttpStatus.CONFLICT:
        return 'Xung đột dữ liệu';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Dữ liệu không thể xử lý';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Quá nhiều yêu cầu';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Dịch vụ tạm thời không khả dụng';
      case HttpStatus.BAD_GATEWAY:
        return 'Dịch vụ bên ngoài không phản hồi';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Hết thời gian chờ';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'Lỗi hệ thống';
    }
  }

  private defaultMessageByStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Dữ liệu gửi lên không hợp lệ';
      case HttpStatus.UNAUTHORIZED:
        return 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn';
      case HttpStatus.FORBIDDEN:
        return 'Bạn không có quyền thực hiện thao tác này';
      case HttpStatus.NOT_FOUND:
        return 'Không tìm thấy dữ liệu yêu cầu';
      case HttpStatus.CONFLICT:
        return 'Dữ liệu đã tồn tại hoặc đang bị xung đột';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Dữ liệu không thể xử lý';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Bạn gửi yêu cầu quá nhanh, vui lòng thử lại sau';
      case HttpStatus.BAD_GATEWAY:
        return 'Dịch vụ bên ngoài đang gặp sự cố, vui lòng thử lại sau';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Dịch vụ phản hồi quá lâu, vui lòng thử lại sau';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'Có lỗi xảy ra, vui lòng thử lại sau';
    }
  }

  private translateMessage(message: string): string {
    const normalized = message.trim();

    const replacements: Array<[RegExp, string | ((match: RegExpExecArray) => string)]> = [
      [/^property (.+) should not exist$/i, (match) => `Thuộc tính "${match[1]}" không được phép gửi lên`],
      [/^(.+) should not be empty$/i, (match) => `${this.prettyFieldName(match[1])} không được để trống`],
      [/^(.+) must be a string$/i, (match) => `${this.prettyFieldName(match[1])} phải là chuỗi`],
      [/^(.+) must be a boolean value$/i, (match) => `${this.prettyFieldName(match[1])} phải là giá trị đúng/sai`],
      [/^(.+) must be an integer number$/i, (match) => `${this.prettyFieldName(match[1])} phải là số nguyên`],
      [/^(.+) must be a number conforming to the specified constraints$/i, (match) => `${this.prettyFieldName(match[1])} phải là số hợp lệ`],
      [/^(.+) must be an email$/i, (match) => `${this.prettyFieldName(match[1])} phải là email hợp lệ`],
      [/^(.+) must be a date$/i, (match) => `${this.prettyFieldName(match[1])} phải là ngày hợp lệ`],
      [/^(.+) must be longer than or equal to (\d+) characters$/i, (match) => `${this.prettyFieldName(match[1])} phải có ít nhất ${match[2]} ký tự`],
      [/^(.+) must be shorter than or equal to (\d+) characters$/i, (match) => `${this.prettyFieldName(match[1])} phải có nhiều nhất ${match[2]} ký tự`],
      [/^(.+) must be between (\d+) and (\d+) characters$/i, (match) => `${this.prettyFieldName(match[1])} phải có từ ${match[2]} đến ${match[3]} ký tự`],
      [/^(.+) must be a valid enum value$/i, (match) => `${this.prettyFieldName(match[1])} không hợp lệ`],
      [/^(.+) must be one of the following values: (.+)$/i, (match) => `${this.prettyFieldName(match[1])} phải là một trong các giá trị: ${match[2]}`],
      [/^(.+) should not be null or undefined$/i, (match) => `${this.prettyFieldName(match[1])} không được là null hoặc undefined`],
      [/^(.+) is not allowed$/i, (match) => `${this.prettyFieldName(match[1])} không được phép`],
      [/^(.+) must be a positive number$/i, (match) => `${this.prettyFieldName(match[1])} phải là số dương`],
      [/^(.+) must be a negative number$/i, (match) => `${this.prettyFieldName(match[1])} phải là số âm`],
      [/^(.+) must be a decimal number$/i, (match) => `${this.prettyFieldName(match[1])} phải là số thập phân`],
      [/^(.+) must be a phone number$/i, (match) => `${this.prettyFieldName(match[1])} phải là số điện thoại hợp lệ`],
      [/^(.+) must be an array$/i, (match) => `${this.prettyFieldName(match[1])} phải là mảng`],
      [/^(.+) must be empty$/i, (match) => `${this.prettyFieldName(match[1])} phải rỗng`],
      [/^(.+) must be a URL address$/i, (match) => `${this.prettyFieldName(match[1])} phải là URL hợp lệ`],
      [/^(.+) must be a valid UUID$/i, (match) => `${this.prettyFieldName(match[1])} phải là UUID hợp lệ`],
      [/^(.+) must match (.+) regular expression$/i, (match) => `${this.prettyFieldName(match[1])} không đúng định dạng`],
      [/^Unexpected end of JSON input$/i, 'Dữ liệu JSON gửi lên không hợp lệ'],
      [/^invalid input syntax for type/i, 'Dữ liệu nhập vào không hợp lệ'],
      [/^jwt expired$/i, 'Phiên đăng nhập đã hết hạn'],
      [/^invalid token$/i, 'Token không hợp lệ'],
      [/^invalid signature$/i, 'Chữ ký token không hợp lệ'],
      [/^refresh token không hợp lệ hoặc đã hết hạn$/i, 'Refresh token không hợp lệ hoặc đã hết hạn'],
      [/^Sai tên đăng nhập hoặc mật khẩu$/i, 'Sai tên đăng nhập hoặc mật khẩu'],
      [/^Mật khẩu hiện tại không đúng$/i, 'Mật khẩu hiện tại không đúng'],
      [/^auth\.invalidCredentials$/i, 'Sai tên đăng nhập hoặc mật khẩu'],
      [/^auth\.accountRevoked$/i, 'Tài khoản đã bị thu hồi'],
      [/^auth\.invalidRefreshToken$/i, 'Refresh token không hợp lệ hoặc đã hết hạn'],
      [/^auth\.revokedRefreshToken$/i, 'Refresh token đã bị thu hồi'],
      [/^auth\.invalidCurrentPassword$/i, 'Mật khẩu hiện tại không đúng'],
      [/^user\.usernameExists$/i, 'Username đã tồn tại'],
      [/^user\.notFound$/i, 'Không tìm thấy người dùng'],
      [/^room\.notFound$/i, 'Không tìm thấy phòng'],
      [/^user\.roomAssignmentNotFound$/i, 'User chưa được gán vào room này'],
      [/^room\.codeExists:(.+)$/i, (match) => `Mã phòng "${match[1]}" đã tồn tại`],
      [/^room\.memberAlreadyExists$/i, 'Người dùng đã là thành viên của phòng này'],
      [/^room\.memberNotFound$/i, 'Không tìm thấy thành viên trong phòng này'],
      [/^face\.imageRequired$/i, 'Ảnh khuôn mặt là bắt buộc'],
      [/^face\.labelNotFound$/i, 'Không tìm thấy nhãn khuôn mặt'],
      [/^mobile\.roomNotAssigned$/i, 'Người dùng hiện tại chưa được gán phòng'],
      [/^hardware\.configNotFound$/i, 'Chưa cấu hình phần cứng cho phòng này'],
      [/^hardware\.adafruitUnavailable$/i, 'Không thể kết nối Adafruit IO, vui lòng kiểm tra cấu hình phần cứng'],
      [/^ai\.serviceUnavailable$/i, 'Dịch vụ AI tạm thời không khả dụng'],
      [/^sensor\.invalidKey:(.+):(.+)$/i, (match) => `Cảm biến "${match[1]}" không hợp lệ. Hợp lệ: ${match[2]}`],
      [/^device\.invalidKey:(.+):(.+)$/i, (match) => `Thiết bị "${match[1]}" không hợp lệ. Hợp lệ: ${match[2]}`],
      [/^device\.globalInvalidKey:(.+):(.+)$/i, (match) => `Thiết bị chung "${match[1]}" không hợp lệ. Hợp lệ: ${match[2]}`],
      [/^autoControl\.unsupportedDevice:(.+)$/i, (match) => `Tự động điều khiển chỉ hỗ trợ: ${match[1]}`],
      [/^autoControl\.manualDisabled:(.+)$/i, (match) => `Vui lòng tắt chế độ tự động của ${match[1]} trước khi điều khiển thủ công`],
      [/^autoControl\.invalidAiAction:(.+)$/i, (match) => `AI không trả về thao tác hợp lệ cho ${match[1]}`],
      [/^command\.valueOrToggleRequired$/i, 'Chỉ cung cấp một trong hai: value hoặc action: toggle'],
      [/^User is already a member of this room$/i, 'Người dùng đã là thành viên của phòng này'],
      [/^Face label is required$/i, 'Nhãn khuôn mặt là bắt buộc'],
      [/^Provide either value or action: toggle$/i, 'Chỉ cung cấp một trong hai: value hoặc action: toggle'],
      [/^Room code "(.+)" already exists$/i, (match) => `Mã phòng "${match[1]}" đã tồn tại`],
      [/^Room not found$/i, 'Không tìm thấy phòng'],
      [/^User not found$/i, 'Không tìm thấy người dùng'],
      [/^Member not found in this room$/i, 'Không tìm thấy thành viên trong phòng này'],
      [/^Face image is required$/i, 'Ảnh khuôn mặt là bắt buộc'],
      [/^Face label not found$/i, 'Không tìm thấy nhãn khuôn mặt'],
      [/^No room assigned to current user$/i, 'Người dùng hiện tại chưa được gán phòng'],
      [/^Hardware config not found for room (.+)$/i, 'Chưa cấu hình phần cứng cho phòng này'],
      [/^Adafruit IO error (\d+): (.+)$/i, 'Không thể kết nối Adafruit IO, vui lòng kiểm tra cấu hình phần cứng'],
      [/^Python AI service is unavailable$/i, 'Dịch vụ AI tạm thời không khả dụng'],
      [/^Invalid sensor key "(.+)". Valid: (.+)$/i, (match) => `Cảm biến "${match[1]}" không hợp lệ. Hợp lệ: ${match[2]}`],
      [/^Invalid device key "(.+)". Valid: (.+)$/i, (match) => `Thiết bị "${match[1]}" không hợp lệ. Hợp lệ: ${match[2]}`],
      [/^Invalid global device key "(.+)". Valid: (.+)$/i, (match) => `Thiết bị chung "${match[1]}" không hợp lệ. Hợp lệ: ${match[2]}`],
      [/^Auto control only supports (.+)$/i, (match) => `Tự động điều khiển chỉ hỗ trợ: ${match[1]}`],
      [/^Disable (.+) auto mode before manual control$/i, (match) => `Vui lòng tắt chế độ tự động của ${match[1]} trước khi điều khiển thủ công`],
      [/^AI did not return a valid (.+) action$/i, (match) => `AI không trả về thao tác hợp lệ cho ${match[1]}`],
    ];

    for (const [pattern, replacement] of replacements) {
      const match = pattern.exec(normalized);
      if (!match) continue;

      if (typeof replacement === 'string') {
        return replacement;
      }

      return replacement(match);
    }

    return normalized;
  }

  private prettyFieldName(value: string): string {
    const cleaned = value
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
}
