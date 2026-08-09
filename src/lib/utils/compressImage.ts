'use client'

/**
 * 업로드 전 클라이언트 이미지 압축 (docs/07 B-5 스펙: 장변 1600px 재인코딩).
 *
 * 왜 필수인가: Vercel 함수 요청 바디 한도가 4.5MB 다. 폰 카메라 원본(3~10MB)을
 * 그대로 서버 액션에 실으면 413 이 난다. canvas 재인코딩은 EXIF(GPS 포함)도
 * 함께 제거되어 개인정보 측면에서도 스펙과 일치한다.
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  // 이미지가 아니거나 이미 충분히 작으면 그대로 둔다
  if (!file.type.startsWith('image/') || file.size < 400_000) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) return file

    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    // 압축 실패 시 원본 유지 — 서버가 413 으로 거르면 사용자에게 실패로 보인다
    return file
  }
}
