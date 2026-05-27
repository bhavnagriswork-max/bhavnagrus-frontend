const mysql = require('mysql2/promise');
require('dotenv').config();

const translations = {
  "premium-bhavnagri-bhakharvadi": {
    name_gu: "પ્રીમિયમ ભાવનગરી ભાખરવડી | કરકરો ગુજરાતી નાસ્તો ૨૫૦ ગ્રામ",
    description_gu: "પેઢીઓથી ચાલી આવતી પરંપરાગત વાનગીઓનો ઉપયોગ કરીને તૈયાર કરાયેલી આ ભાખરવડી મસાલેદાર અને ક્રિસ્પી છે. ઉત્તમ ચણાનો લોટ, સુગંધિત મસાલા, તલ અને સૂકા મેવાના મિશ્રણથી બનેલો આ નાસ્તો ચાના સમય માટે ઉત્તમ છે. કોઈ પણ કૃત્રિમ પ્રિઝર્વેટિવ્સ વગર વેક્યૂમ-સીલ્ડ પેકિંગમાં ઉપલબ્ધ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-chakri": {
    name_gu: "પ્રીમિયમ ભાવનગરી ચકરી | ક્રિસ્પી ચોખાના લોટની ચકરી ૨૫૦ ગ્રામ",
    description_gu: "ચોખાના લોટ અને સુગંધિત મસાલાના ઉત્તમ મિશ્રણમાંથી બનેલી આ ગોલ્ડન અને ક્રિસ્પી ચકરી સ્વાદિષ્ટ અને પરંપરાગત છે. સાંજની ચા, તહેવારો અને કૌટુંબિક મેળાવડા માટે શ્રેષ્ઠ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-chana-bhajiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી ચણા ભજીયા | ચણા દાળના કરકરા ભજીયા ૨૫૦ ગ્રામ",
    description_gu: "ચણાની દાળ અને મસાલેદાર ચણાના લોટના ખીરામાંથી બનેલો આ કરકરો અને સ્વાદિષ્ટ નાસ્તો અસલી ગુજરાતી સ્વાદ આપે છે. લાલ મરચું, હળદર અને જીરાના પરફેક્ટ મિશ્રણ સાથે મસાલેદાર સ્વાદ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-cheese-peanuts": {
    name_gu: "પ્રીમિયમ ભાવનગરી ચીઝ સીંગ | ચીઝી કોટેડ શેકેલી સીંગ ૨૫૦ ગ્રામ",
    description_gu: "શેકેલી સીંગ અને સમૃદ્ધ ચીઝ ફ્લેવરનું અદભુત મિશ્રણ. પિઝા નાઈટ અને પ્રવાસ માટે શ્રેષ્ઠ. પ્રોટીનથી ભરપૂર અને અત્યંત સ્વાદિષ્ટ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-dry-kachori": {
    name_gu: "પ્રીમિયમ ભાવનગરી ડ્રાય કચોરી | કરકરી મીની ડ્રાય કચોરી ૨૫૦ ગ્રામ",
    description_gu: "મગની દાળ, સુગંધિત મસાલા અને હિંગના સ્વાદિષ્ટ મિશ્રણથી ભરેલી આ સોનેરી અને ક્રિસ્પી મિની કચોરી ચાના સમય કે મુસાફરી માટે ઉત્તમ છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-fried-moong": {
    name_gu: "પ્રીમિયમ ભાવનગરી ફ્રાઈડ મગ | નમકીન મગની દાળ ૨૫૦ ગ્રામ",
    description_gu: "સોનેરી રંગે તળેલી અને સિંધાલૂણ મીઠું તેમજ હળદરથી સજાવેલી પ્રોટીનયુક્ત મગની દાળ. ચા સાથે ખાવા માટે એક ઉત્તમ અને પૌષ્ટિક નાસ્તો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-garlic-chana-bhajiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી લસણીયા ચણા ભજીયા | લસણ મસાલા ભજીયા ૨૫૦ ગ્રામ",
    description_gu: "ચણાની દાળ, તાજું લસણ અને મસાલેદાર ચણાના લોટના ખીરામાંથી બનેલો આ લસણીયો નાસ્તો લસણપ્રેમીઓ માટે એક અદભુત અનુભવ છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-hing-jeera-chana": {
    name_gu: "પ્રીમિયમ ભાવનગરી હિંગ જીરા ચણા | હિંગ અને જીરાના શેકેલા ચણા ૨૫૦ ગ્રામ",
    description_gu: "હિંગ, શેકેલા જીરાનો પાવડર, સંચળ અને આમચૂરના મિશ્રણ સાથે તૈયાર કરેલા ચણા. સ્વાસ્થ્યપ્રદ અને સ્વાદિષ્ટ પ્રોટીનયુક્ત નાસ્તો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-lasaniya-gathiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી લસણીયા ગાંઠિયા | લસણના સ્વાદિષ્ટ ગાંઠિયા ૨૫૦ ગ્રામ",
    description_gu: "તાજા લસણની પેસ્ટ અને મસાલેદાર ચણાના લોટના મિશ્રણમાંથી બનેલા આ ગરમાગરમ સોનેરી ગાંઠિયા લસણના પ્રેમીઓ માટે શ્રેષ્ઠ પસંદગી છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-makai-chevdo": {
    name_gu: "પ્રીમિયમ ભાવનગરી મકાઈ ચેવડો | ચટપટો મકાઈનો ચેવડો ૨૫૦ ગ્રામ",
    description_gu: "મકાઈના પૌઆ, શેકેલી સીંગ, તીખી સેવ, મીઠા લીમડા અને સરસવના પરફેક્ટ મિશ્રણ સાથે બનેલો ખાટો-મીઠો-તીખો ચેવડો જે દરેક ગુજરાતી ઘરની ઓળખ છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-makhaniya-gathiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી માખણિયા ગાંઠિયા | મુલાયમ મોળા ગાંઠિયા ૨૫૦ ગ્રામ",
    description_gu: "ખાસ લોટ અને માખણના સ્વાદ સાથે અત્યંત મુલાયમ અને મોઢામાં ઓગળી જાય તેવા ગાંઠિયા. મરી અને અજમાનો હળવો સ્વાદ આ નાષ્ટાને વધુ સ્વાદિષ્ટ બનાવે છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-mari-gathiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી મરી ગાંઠિયા | કાળા મરીના ગાંઠિયા ૨૫૦ ગ્રામ",
    description_gu: "તીખા અને ગરમાગરમ કાળા મરીના પાવડર સાથે બનેલા ચણાના લોટના ગાંઠિયા. તીખાશના શોખીનો માટે ચા સાથે એક અદભુત જોડી. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-nylon-gathiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી નાયલોન ગાંઠિયા | રેશમી બારીક ગાંઠિયા ૨૫૦ ગ્રામ",
    description_gu: "ભાવનગરની એક વિશેષતા - અત્યંત પાતળી અને રેશમ જેવી મુલાયમ સેવ જે મોઢામાં મુકતા જ ઓગળી જાય છે. ભેળ કે ચાટ પર નાખવા માટે કે એકલા ખાવા માટે પણ શ્રેષ્ઠ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-papad-chevdo": {
    name_gu: "પ્રીમિયમ ભાવનગરી પાપડ ચેવડો | ક્રિસ્પી પાપડનો ચેવડો ૨૫૦ ગ્રામ",
    description_gu: "ક્રિસ્પી પાપડના ટુકડા, શેકેલી સીંગ અને તલના મિશ્રણ સાથે બનેલો ભાવનગરની પરંપરાગત વાનગીનો સ્વાદિષ્ટ ચેવડો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-pizza-puri": {
    name_gu: "પ્રીમિયમ ભાવનગરી પિઝા પુરી | ઇટાલિયન-ઇન્ડિયન ફ્યુઝન પુરી ૨૫૦ ગ્રામ",
    description_gu: "ઇટાલિયન પિઝાના મસાલા અને ભારતની ક્રિસ્પી પુરીનું એક અનોખું ફ્યુઝન. ઓરેગાનો, ટમેટા અને ચીઝના ફ્લેવર સાથે બાળકો અને વડીલો માટે મજેદાર નાસ્તો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-salted-peanuts": {
    name_gu: "પ્રીમિયમ ભાવનગરી ખારી સીંગ | ક્લાસિક શેકેલી નમકીન સીંગ ૨૫૦ ગ્રામ",
    description_gu: "ધીમી આંચે શેકેલી અને સિંધાલૂણ મીઠાથી સજાવેલી ક્લાસિક સીંગ. કુદરતી પ્રોટીન અને ફાઇબરથી ભરપૂર તંદુરસ્ત નાસ્તો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-special-sev": {
    name_gu: "પ્રીમિયમ ભાવનગરી સ્પેશિયલ સેવ | મસાલેદાર ઝીણી સેવ ૨૫૦ ગ્રામ",
    description_gu: "ચણાના લોટ અને અજમાના પરફેક્ટ મિશ્રણથી બનેલી સોનેરી અને મસાલેદાર સેવ. ચાટને ગાર્નિશ કરવા કે ચા સાથે સ્વાદ માણવા માટે શ્રેષ્ઠ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-sweet-chatpata-peanuts": {
    name_gu: "પ્રીમિયમ ભાવનગરી ખાટી મીઠી સીંગ | ચટપટી મસાલા સીંગ ૨૫૦ ગ્રામ",
    description_gu: "ગોળ, આમચૂર અને ચાટ મસાલાના કોટિંગ સાથે ખાટો-મીઠો-તીખો સ્વાદ ધરાવતી અદભુત સીંગ જે કોઈ પણ મેળાવડાની શાન બની જશે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-tikha-gathiya": {
    name_gu: "પ્રીમિયમ ભાવનગરી તીખા ગાંઠિયા | મસાલેદાર તીખા ગાંઠિયા ૨૫૦ ગ્રામ",
    description_gu: "લાલ મરચું અને તીખા મસાલાથી ભરપૂર ચણાના લોટના તીખા ગાંઠિયા. તીખાશના ચાહકો માટે એક પડકારરૂપ અને સ્વાદિષ્ટ નાસ્તો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-til-papdi": {
    name_gu: "પ્રીમિયમ ભાવનગરી તલ પાપડી | તલની ક્રિસ્પી પટ્ટી ૨૫૦ ગ્રામ",
    description_gu: "સફેદ તલ અને ચણાના લોટમાંથી બનેલી એકદમ પાતળી અને કરકરી પાપડી જે કૌટુંબિક પ્રસંગો અને તહેવારો માટે અસલી સ્વાદ લાવે છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-magic-puri": {
    name_gu: "પ્રીમિયમ ભાવનગરી મેજિક પુરી | મસાલેદાર ફ્લેકી પુરી ૨૫૦ ગ્રામ",
    description_gu: "મરી, અજમો અને હળદરથી સજાવેલી સોનેરી અને ક્રિસ્પી પુરી જે મોંમાં મુકતા જ ઓગળી જાય છે. ચાના સમય કે પિકનિક માટે ઉત્તમ. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-mix-kathol": {
    name_gu: "પ્રીમિયમ ભાવનગરી મિક્સ કઠોળ | અંકુરિત મસાલેદાર કઠોળ ૨૫૦ ગ્રામ",
    description_gu: "અંકુરિત કઠોળ, મગ, મઠ અને ચણાને શેકીને તીખી સેવ, સીંગ અને હિંગના વઘાર સાથે તૈયાર કરેલો પૌષ્ટિક અને નમકીન નાસ્તો. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-nylon-papadi": {
    name_gu: "પ્રીમિયમ ભાવનગરી નાયલોન પાપડી | ક્રિસ્પી પાતળી પાપડી ૨૫૦ ગ્રામ",
    description_gu: "ચણાના લોટ, અજમો અને હિંગના સ્વાદથી ભરપૂર સોનેરી રંગે તળેલી પાતળી રીબન જેવી પાપડી જે રવિવારના સવારના નાસ્તા માટે જલેબી સાથે ઉત્તમ જોડી બનાવે છે. વજન: ૨૫૦ ગ્રામ."
  },
  "premium-bhavnagri-jhal-muri": {
    name_gu: "પ્રીમિયમ ભાવનગરી ઝાલ મુરી | ચટપટી તીખી મમરાની ભેળ ૨૫૦ ગ્રામ",
    description_gu: "પૂર્વ અને પશ્ચિમનો એક અનોખો સમન્વય - તીખી સેવ, શેકેલી સીંગ અને અસલી સરસવના તેલના ફ્લેવર સાથે બનેલી ઝાલ મુરી સાંજની વાતો માટે એક ઉત્તમ નાસ્તો છે. વજન: ૨૫૦ ગ્રામ."
  }
};

async function tryConnect(credentials) {
  try {
    const db = await mysql.createConnection(credentials);
    return db;
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log('Attempting to connect to database...');
  
  const localCreds = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bhavnagar_food_ecommerce'
  };

  const cleverCreds = {
    host: 'bqv6zhaewgm8mvtusoi1-mysql.services.clever-cloud.com',
    user: 'u9a4s0c02loyqhbm',
    password: 'xhn7nHlNAzcAiJxwUrKx',
    database: 'bqv6zhaewgm8mvtusoi1'
  };

  let db = await tryConnect(localCreds);
  if (db) {
    console.log('✅ Connected to Local Database!');
  } else {
    console.log('⚠️ Local Database connection failed. Attempting Clever Cloud Database connection...');
    db = await tryConnect(cleverCreds);
    if (db) {
      console.log('✅ Connected to Clever Cloud Database!');
    }
  }

  if (!db) {
    console.error('❌ Could not connect to either Local or Clever Cloud Databases. Please make sure your database is running.');
    process.exit(1);
  }

  try {
    // 1. Alter Table to add columns if they don't exist
    const [columns] = await db.query('SHOW COLUMNS FROM products');
    const nameGuExists = columns.some(col => col.Field === 'name_gu');
    const descGuExists = columns.some(col => col.Field === 'description_gu');

    if (!nameGuExists) {
      console.log('Adding column "name_gu" to products table...');
      await db.query('ALTER TABLE products ADD COLUMN name_gu VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER name');
    } else {
      console.log('Column "name_gu" already exists.');
    }

    if (!descGuExists) {
      console.log('Adding column "description_gu" to products table...');
      await db.query('ALTER TABLE products ADD COLUMN description_gu MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER description');
    } else {
      console.log('Column "description_gu" already exists.');
    }

    // 2. Fetch all products to match translations
    const [products] = await db.query('SELECT id, name, slug FROM products');
    console.log(`Fetched ${products.length} products from database. Starting updates...`);

    let updatedCount = 0;
    for (const prod of products) {
      const trans = translations[prod.slug];
      if (trans) {
        console.log(`Updating translation for slug: "${prod.slug}"...`);
        await db.query(
          'UPDATE products SET name_gu = ?, description_gu = ? WHERE id = ?',
          [trans.name_gu, trans.description_gu, prod.id]
        );
        updatedCount++;
      } else {
        // Generically translate or keep same if it's a perfume/puja item
        console.log(`No manual translation for "${prod.name}" (${prod.slug}). Translating generically...`);
        let name_gu = prod.name;
        let description_gu = `પરંપરાગત રીતે પ્રસ્તુત, ઉચ્ચ ગુણવત્તાવાળી પેદાશ.`;
        
        if (prod.slug.includes('perfume')) {
          name_gu = prod.name.replace(/Luxury Perfume/i, 'લક્ઝરી પરફ્યુમ').replace(/Fragrance/i, 'સુગંધ');
          description_gu = `પ્રીમિયમ લક્ઝરી પરફ્યુમ સ્પ્રે, પુરુષો અને મહિલાઓ બંને માટે લાંબો સમય ટકી રહે તેવી અદભુત સુગંધ.`;
        } else if (prod.slug.includes('puja')) {
          name_gu = prod.name.replace(/Puja/i, 'પૂજા સામગ્રી');
          description_gu = `પૂજા અને આધ્યાત્મિક પ્રસંગો માટે ઉચ્ચ ગુણવત્તાયુક્ત પવિત્ર સામગ્રી.`;
        }

        await db.query(
          'UPDATE products SET name_gu = ?, description_gu = ? WHERE id = ?',
          [name_gu, description_gu, prod.id]
        );
        updatedCount++;
      }
    }

    console.log(`Successfully completed migration! Updated ${updatedCount} products.`);
  } catch (err) {
    console.error('Error during Gujarati migration:', err);
  } finally {
    await db.end();
  }
}

run();
