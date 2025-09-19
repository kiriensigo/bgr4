export interface AffiliateConfig {
  amazon: {
    affiliateId: string;
    baseUrl: string;
  };
  rakuten: {
    applicationId: string;
    affiliateId: string;
    baseUrl: string;
  };
  yahoo: {
    valueCommerId: string;
    baseUrl: string;
  };
  suruga: {
    affiliateId?: string;
    baseUrl: string;
  };
}

// アフィリエイト設定
const affiliateConfig: AffiliateConfig = {
  amazon: {
    affiliateId: process.env['NEXT_PUBLIC_AMAZON_AFFILIATE_ID'] || '',
    baseUrl: 'https://www.amazon.co.jp'
  },
  rakuten: {
    applicationId: process.env['NEXT_PUBLIC_RAKUTEN_APP_ID'] || '',
    affiliateId: process.env['NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID'] || '',
    baseUrl: 'https://search.rakuten.co.jp'
  },
  yahoo: {
    valueCommerId: process.env['NEXT_PUBLIC_YAHOO_VALUE_COMMERCE_ID'] || '',
    baseUrl: 'https://shopping.yahoo.co.jp'
  },
  suruga: {
    affiliateId: process.env['NEXT_PUBLIC_SURUGA_AFFILIATE_ID'],
    baseUrl: 'https://www.suruga-ya.jp'
  }
};

export interface ShoppingLinks {
  bgg: string;
  amazon: string;
  rakuten: string;
  yahoo: string;
  suruga: string;
}

/**
 * ゲーム名から各ショッピングサイトへのリンクを生成
 * 将来的にアフィリエイトリンクに切り替え可能
 */
export function generateShoppingLinks(gameName: string): ShoppingLinks {
  const encodedGameName = encodeURIComponent(gameName);
  
  // BGGは検索のみ（アフィリエイトなし）
  const bgg = `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodedGameName}`;
  
  // Amazon
  let amazon = `${affiliateConfig.amazon.baseUrl}/s?k=${encodedGameName}`;
  if (affiliateConfig.amazon.affiliateId) {
    amazon += `&tag=${affiliateConfig.amazon.affiliateId}`;
  }
  
  // 楽天
  let rakuten = `${affiliateConfig.rakuten.baseUrl}/search/mall/${encodedGameName}`;
  if (affiliateConfig.rakuten.affiliateId && affiliateConfig.rakuten.applicationId) {
    rakuten += `?f=1&grp=product&p=0&s=1&e=0&v=3&oid=000&aid=${affiliateConfig.rakuten.affiliateId}&ic=1000&sp=1&sf=1&sid=${affiliateConfig.rakuten.applicationId}`;
  }
  
  // Yahoo（バリューコマース）
  let yahoo = `${affiliateConfig.yahoo.baseUrl}/search?p=${encodedGameName}`;
  if (affiliateConfig.yahoo.valueCommerId) {
    // バリューコマースのアフィリエイトリンク形式
    yahoo = `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${affiliateConfig.yahoo.valueCommerId}&pid=XXX&vc_url=${encodeURIComponent(yahoo)}`;
  }
  
  // 駿河屋
  let suruga = `${affiliateConfig.suruga.baseUrl}/search?category=&search_word=${encodedGameName}`;
  if (affiliateConfig.suruga.affiliateId) {
    suruga += `&affiliate=${affiliateConfig.suruga.affiliateId}`;
  }
  
  return {
    bgg,
    amazon,
    rakuten,
    yahoo,
    suruga
  };
}

/**
 * アフィリエイト設定が有効かどうかをチェック
 */
export function getAffiliateStatus() {
  return {
    amazon: Boolean(affiliateConfig.amazon.affiliateId),
    rakuten: Boolean(affiliateConfig.rakuten.affiliateId && affiliateConfig.rakuten.applicationId),
    yahoo: Boolean(affiliateConfig.yahoo.valueCommerId),
    suruga: Boolean(affiliateConfig.suruga.affiliateId)
  };
}

/**
 * 開発環境用のアフィリエイトリンク表示デバッグ情報
 */
export function debugAffiliateLinks(gameName: string) {
  if (process.env.NODE_ENV === 'development') {
    const links = generateShoppingLinks(gameName);
    const status = getAffiliateStatus();
    
    console.log('🔗 Generated shopping links for:', gameName);
    console.log('📊 Affiliate status:', status);
    console.log('🌐 Links:', links);
    
    return { links, status };
  }
  return null;
}
