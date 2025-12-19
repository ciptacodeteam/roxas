/**
 * Email templates with game design pattern
 * Colors: Dark background (#1B2129), Primary accent (rose/orange), White text
 */

export function getWelcomeEmailTemplate(name: string | null, email: string, baseUrl: string = "https://yourdomain.com"): string {
  const displayName = name || "Gamer";
  
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Datang di Roxas Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #13171C;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #13171C;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1B2129; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1B2129 0%, #2a3441 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                🎮 ROXAS STORE
              </h1>
              <p style="margin: 10px 0 0 0; color: #a0a0a0; font-size: 14px;">Game Top-Up & Digital Services</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Selamat Datang, ${displayName}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #d0d0d0; font-size: 16px; line-height: 1.6;">
                Terima kasih telah bergabung dengan <strong style="color: #ff6b6b;">Roxas Store</strong>! 
                Kami senang Anda menjadi bagian dari komunitas gaming kami.
              </p>
              
              <div style="background-color: rgba(255, 107, 107, 0.1); border-left: 4px solid #ff6b6b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ff6b6b;">Akun Anda:</strong><br>
                  Email: ${email}<br>
                  Status: Aktif
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #d0d0d0; font-size: 16px; line-height: 1.6;">
                Mulai jelajahi berbagai produk game top-up, diamond, dan layanan digital lainnya 
                yang tersedia di platform kami. Setiap transaksi Anda aman dan terjamin!
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${baseUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); 
                          color: #ffffff; text-decoration: none; padding: 16px 40px; 
                          border-radius: 8px; font-weight: 600; font-size: 16px; 
                          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
                  Mulai Berbelanja 🛒
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #171D25; padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 10px 0; color: #a0a0a0; font-size: 14px;">
                © ${new Date().getFullYear()} Roxas Store. All rights reserved.
              </p>
              <p style="margin: 0; color: #808080; font-size: 12px;">
                Email ini dikirim ke ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getVerificationEmailTemplate(name: string | null, email: string, verificationUrl: string): string {
  const displayName = name || "Gamer";
  
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email - Roxas Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #13171C;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #13171C;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1B2129; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1B2129 0%, #2a3441 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                🎮 ROXAS STORE
              </h1>
              <p style="margin: 10px 0 0 0; color: #a0a0a0; font-size: 14px;">Verifikasi Email Anda</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Verifikasi Email Anda 🔐
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #d0d0d0; font-size: 16px; line-height: 1.6;">
                Halo <strong style="color: #ff6b6b;">${displayName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #d0d0d0; font-size: 16px; line-height: 1.6;">
                Terima kasih telah mendaftar di <strong style="color: #ff6b6b;">Roxas Store</strong>! 
                Untuk mengaktifkan akun Anda dan memastikan keamanan, silakan verifikasi alamat email Anda.
              </p>
              
              <div style="background-color: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ffc107;">⚠️ Penting:</strong><br>
                  Verifikasi email diperlukan untuk mengaktifkan semua fitur akun Anda, 
                  termasuk transaksi dan notifikasi penting.
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); 
                          color: #ffffff; text-decoration: none; padding: 16px 40px; 
                          border-radius: 8px; font-weight: 600; font-size: 16px; 
                          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
                  Verifikasi Email Sekarang ✅
                </a>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                Atau salin dan tempel link berikut ke browser Anda:<br>
                <a href="${verificationUrl}" style="color: #ff6b6b; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; margin: 30px 0; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="margin: 0; color: #a0a0a0; font-size: 13px; line-height: 1.6;">
                  <strong style="color: #ffffff;">Catatan Keamanan:</strong><br>
                  Link verifikasi ini akan kedaluwarsa dalam 24 jam. 
                  Jika Anda tidak meminta verifikasi email ini, abaikan email ini.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #171D25; padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 10px 0; color: #a0a0a0; font-size: 14px;">
                © ${new Date().getFullYear()} Roxas Store. All rights reserved.
              </p>
              <p style="margin: 0; color: #808080; font-size: 12px;">
                Email ini dikirim ke ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getPasswordResetEmailTemplate(name: string | null, email: string, resetUrl: string): string {
  const displayName = name || "Gamer";
  
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Roxas Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #13171C;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #13171C;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1B2129; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1B2129 0%, #2a3441 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                🎮 ROXAS STORE
              </h1>
              <p style="margin: 10px 0 0 0; color: #a0a0a0; font-size: 14px;">Reset Kata Sandi Anda</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Reset Kata Sandi 🔐
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #d0d0d0; font-size: 16px; line-height: 1.6;">
                Halo <strong style="color: #ff6b6b;">${displayName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #d0d0d0; font-size: 16px; line-height: 1.6;">
                Kami menerima permintaan untuk mereset kata sandi akun <strong style="color: #ff6b6b;">Roxas Store</strong> Anda. 
                Jika Anda yang meminta, silakan klik tombol di bawah untuk membuat kata sandi baru.
              </p>
              
              <div style="background-color: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; color: #ffffff; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ffc107;">⚠️ Penting:</strong><br>
                  Link reset password ini akan kedaluwarsa dalam 1 jam. 
                  Jika Anda tidak meminta reset password, abaikan email ini dan kata sandi Anda tidak akan berubah.
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); 
                          color: #ffffff; text-decoration: none; padding: 16px 40px; 
                          border-radius: 8px; font-weight: 600; font-size: 16px; 
                          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
                  Reset Kata Sandi Sekarang 🔑
                </a>
              </div>
              
              <p style="margin: 30px 0 0 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                Atau salin dan tempel link berikut ke browser Anda:<br>
                <a href="${resetUrl}" style="color: #ff6b6b; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; margin: 30px 0; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="margin: 0; color: #a0a0a0; font-size: 13px; line-height: 1.6;">
                  <strong style="color: #ffffff;">Catatan Keamanan:</strong><br>
                  Jika Anda tidak meminta reset password, segera hubungi tim support kami. 
                  Jangan bagikan link ini kepada siapa pun.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #171D25; padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 10px 0; color: #a0a0a0; font-size: 14px;">
                © ${new Date().getFullYear()} Roxas Store. All rights reserved.
              </p>
              <p style="margin: 0; color: #808080; font-size: 12px;">
                Email ini dikirim ke ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
