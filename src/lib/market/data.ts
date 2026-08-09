import 'server-only'

import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { CATEGORY_PRODUCTS, type MarketItem } from '@/lib/mock/home'

/**
 * 쇼핑몰 상품 (사용자 확정 사양) — 등록은 설계사·관리자만, 노출은 전체 공개.
 * Firestore `products` 는 서버 전용으로 읽고 쓴다. Rules 기본 deny 그대로 —
 * 클라이언트 직접 접근 경로가 없다.
 */

export type Product = MarketItem & {
  desc: string
  sellerName: string
  phone: string
  /** 찾는 장소 (사용자 확정 사양) — 직접 수령 위치. */
  pickupPlace: string
  /** 배달 가능 유무 + 배달비 (표기 전용, 배차·정산 없음). */
  deliveryAvailable: boolean
  deliveryFee: number
  createdAt: string | null
  real: boolean
}

function toProduct(id: string, d: FirebaseFirestore.DocumentData): Product {
  return {
    id,
    name: (d.name as string) ?? '',
    sub: (d.sub as string) ?? '',
    price: (d.price as number) ?? 0,
    image: (d.imageURL as string) ?? '',
    best: d.best === true,
    desc: (d.desc as string) ?? '',
    sellerName: (d.sellerName as string) ?? '',
    phone: (d.phone as string) ?? '',
    pickupPlace: (d.pickupPlace as string) ?? '',
    deliveryAvailable: d.deliveryAvailable === true,
    deliveryFee: (d.deliveryFee as number) ?? 0,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null,
    real: true,
  }
}

/** 실상품 + 목데이터 폴백 (화면이 비지 않게). 실상품이 앞에 온다. */
export async function listProducts(): Promise<Product[]> {
  const snap = await getAdminDb()
    .collection('products')
    .where('status', '==', 'active')
    .limit(60)
    .get()
  const real = snap.docs
    .map((doc) => toProduct(doc.id, doc.data()))
    .filter((p) => p.image)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const mock: Product[] = Object.values(CATEGORY_PRODUCTS)
    .flat()
    .filter((item, i, arr) => arr.findIndex((x) => x.id === item.id) === i)
    .map((item) => ({
      ...item,
      desc: item.sub,
      sellerName: '',
      phone: '',
      pickupPlace: '',
      deliveryAvailable: false,
      deliveryFee: 0,
      createdAt: null,
      real: false,
    }))

  return [...real, ...mock]
}

export async function getProduct(productId: string): Promise<Product | null> {
  const doc = await getAdminDb().collection('products').doc(productId).get()
  if (doc.exists && doc.data()!.status === 'active') return toProduct(doc.id, doc.data()!)
  const mock = (await listProducts()).find((p) => p.id === productId && !p.real)
  return mock ?? null
}

/** 메인 고정 슬롯용 — 요청마다 랜덤 n개 (사용자 확정 사양). */
export async function listRandomProducts(count = 6): Promise<Product[]> {
  const all = await listProducts()
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i]!, all[j]!] = [all[j]!, all[i]!]
  }
  return all.slice(0, count)
}
