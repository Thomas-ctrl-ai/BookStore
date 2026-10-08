import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "@/lib/catalog";
import { AddToCart } from "@/components/add-to-cart";
function ks(n:number){return `Ks ${n.toLocaleString("en-US")}`}
export function ProductCard({product}:{product:CatalogProduct}){
 const soldOut=product.stock<1;
 const levels=product.levels.length?product.levels:product.level?[product.level]:[];
 const levelLabel=levels.length===1?`Level ${levels[0]}`:levels.length?`${levels.length} levels`:"";
 return <article className="product-card">
  <Link href={`/products/${product.slug}`} className="book-cover" aria-label={`View ${product.title}`}>
   {product.imageUrl?<Image unoptimized fill sizes="(max-width:620px) 42vw, (max-width:900px) 28vw, 20vw" style={{objectFit:"cover",borderRadius:5}} src={product.imageUrl} alt={`Cover of ${product.title}`} loading="lazy"/>:<span className="book-cover-title">{product.title}</span>}
   <span className="cover-label">{product.sampleData?"Sample listing":product.category.name}</span>
  </Link>
  <div className="product-info">
   <span className="product-category">{product.category.name}{levelLabel?` · ${levelLabel}`:""}</span>
   <h3><Link href={`/products/${product.slug}`}>{product.title}</Link></h3>
   <p className="product-author">{product.author||"P&K Book Store"}</p>
   <div className="product-bottom"><div><div className="price">{product.priceMmk?ks(product.priceMmk):"Sample · set price"}</div><div className={`stock ${soldOut?"out":""}`}>{soldOut?(product.sampleData?"Sample only · not for sale":"Out of stock"):"In stock"}</div></div>
    {levels.length?<Link className="button button-secondary card-detail-link" href={`/products/${product.slug}`}>Choose level</Link>:<AddToCart disabled={soldOut||product.priceMmk===0} product={{productId:product.id,slug:product.slug,title:product.title,priceMmk:product.priceMmk,imageUrl:product.imageUrl}}/>}
   </div>
  </div>
 </article>
}
