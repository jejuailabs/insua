// 자동 생성 파일 — 직접 고치지 말 것.
// scripts/upload-dummy-images.mts 가 Firebase Storage 업로드 후 다시 쓴다.
//
// 개발용 더미 이미지 URL. 실제 콘텐츠가 아니고 실인물도 아니다 (gpt-image-2 생성물).
// 이미지 실물은 저장소에 없다 — Vercel 번들 용량을 먹지 않게 Storage 에만 둔다.

export const avatars = {
  choiYujin: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fchoi-yujin.webp?alt=media&token=cae68c64-b7e6-428e-81c9-02df44557b7f',
  jungHaeun: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fjung-haeun.webp?alt=media&token=a859b329-33ed-422f-b169-5790bf6929a1',
  kangDonghyun: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fkang-donghyun.webp?alt=media&token=0c0b5717-9d10-4fb7-a0e0-f466b32c60ba',
  kimMinsu: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fkim-minsu.webp?alt=media&token=23396429-4437-4849-b7d0-b1e889f4beee',
  leeJeongeun: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Flee-jeongeun.webp?alt=media&token=472a7ead-a2d4-41d0-b166-58ec31e5ae79',
  parkCheolsu: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fpark-cheolsu.webp?alt=media&token=586a7d1d-d2c9-4756-8850-2dab9815cb9e',
  songMira: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fsong-mira.webp?alt=media&token=827416d1-8ecd-4643-bb99-689b79ee4725',
  yoonTaeho: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Favatars%2Fyoon-taeho.webp?alt=media&token=c82c6643-3c5e-4527-a0e6-9bb08e8e0a24',
} as const

export type AvatarsKey = keyof typeof avatars

export const merchants = {
  cafeOreum: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fmerchants%2Fcafe-oreum.webp?alt=media&token=0feb13cf-4b13-4b99-8e3d-27fa25c942fd',
  haenyeoBapsang: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fmerchants%2Fhaenyeo-bapsang.webp?alt=media&token=eec5c24d-12bd-4584-be72-86edca4db18e',
  hairStudio: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fmerchants%2Fhair-studio.webp?alt=media&token=7d51de3a-2821-404a-b073-37690145303d',
  jejuFarmer: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fmerchants%2Fjeju-farmer.webp?alt=media&token=9e571a5e-2c51-47a7-9ae0-0e8a63b36ed2',
  morningBakery: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fmerchants%2Fmorning-bakery.webp?alt=media&token=93c2c155-136f-4f1e-9137-99b65b395478',
  sandeulBbq: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fmerchants%2Fsandeul-bbq.webp?alt=media&token=d07e66e1-89f4-4de5-9bd8-7fc50d13fb87',
} as const

export type MerchantsKey = keyof typeof merchants

export const products = {
  abaloneStew: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fabalone-stew.webp?alt=media&token=d6e8d17b-d6c8-4230-827a-e3294c139fec',
  blackPork: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fblack-pork.webp?alt=media&token=85876aea-1419-4c25-9efb-bd7abb93d53f',
  broccoli: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fbroccoli.webp?alt=media&token=d5bdc4ff-7078-43ac-944c-435c45d91808',
  carrot: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fcarrot.webp?alt=media&token=5852a6e1-4350-4a1c-b131-d7afb7e6d912',
  coffeeBeans: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fcoffee-beans.webp?alt=media&token=4aca1cc9-9444-4ee8-8d98-bb7973554190',
  cookieSet: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fcookie-set.webp?alt=media&token=5dc2ada1-59aa-4643-b10d-abf0f4a1e107',
  croissant: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fcroissant.webp?alt=media&token=cfd56cc5-2cbd-4245-be5b-f783abebe364',
  hairOil: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fhair-oil.webp?alt=media&token=e6774597-e8e1-4bd3-b735-7e0f13c788eb',
  jejuTangerine: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fjeju-tangerine.webp?alt=media&token=c4742df9-702d-47a1-a867-2b1a9fce3b90',
  latte: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Flatte.webp?alt=media&token=765442e7-ec31-46a2-b7f8-0b8d25cc91fa',
  potato: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fpotato.webp?alt=media&token=74237407-ebfa-4d09-9324-7671190386b5',
  seaweedSoup: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fseaweed-soup.webp?alt=media&token=61a397c4-a3f2-4a61-b4bd-acf4bcae6e86',
  shampoo: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fshampoo.webp?alt=media&token=ab8b23ab-cc1e-4684-b4a8-9ed9a19eb94b',
  sweetBread: 'https://firebasestorage.googleapis.com/v0/b/insua-44b86.firebasestorage.app/o/dummy%2Fproducts%2Fsweet-bread.webp?alt=media&token=7bcba174-4efa-4630-a917-a7eea74eaafe',
} as const

export type ProductsKey = keyof typeof products
