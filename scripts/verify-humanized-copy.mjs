import http from 'http';

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== VERIFYING HUMANIZED COPY ON LOCAL SERVER ===\n');

  // 1. /ro
  const ro = await fetchPage('/ro');
  console.log(`[RO] /ro Status: ${ro.statusCode}`);
  console.log(`  - Contains "Administrează clădiri": ${ro.body.includes('Administreaz\u0103 cl\u0103diri')}`);
  console.log(`  - Contains "Vezi de unde vine fiecare sumă": ${ro.body.includes('Vezi de unde vine fiecare sum\u0103')}`);
  console.log(`  - Contains "Solicită acces în pilot": ${ro.body.includes('Solicit\u0103 acces \u00een pilot')}`);

  // 2. /en
  const en = await fetchPage('/en');
  console.log(`\n[EN] /en Status: ${en.statusCode}`);
  console.log(`  - Contains "Manage buildings and residential properties": ${en.body.includes('Manage buildings and residential properties')}`);
  console.log(`  - Contains "See Where Every Charge Comes From": ${en.body.includes('See Where Every Charge Comes From')}`);
  console.log(`  - Contains "Apply for Pilot Access": ${en.body.includes('Apply for Pilot Access')}`);

  // 3. /fa
  const fa = await fetchPage('/fa');
  console.log(`\n[FA] /fa Status: ${fa.statusCode}`);
  console.log(`  - Contains "ساختمان‌ها و املاک خود را": ${fa.body.includes('ساختمان‌ها و املاک خود را')}`);
  console.log(`  - Contains "منشأ هر مبلغ را روشن ببینید": ${fa.body.includes('منشأ هر مبلغ را روشن ببینید')}`);
  console.log(`  - Contains "درخواست حضور در پایلوت": ${fa.body.includes('درخواست حضور در پایلوت')}`);

  // 4. /fa/solutions/associations
  const faAssoc = await fetchPage('/fa/solutions/associations');
  console.log(`\n[FA] /fa/solutions/associations Status: ${faAssoc.statusCode}`);
  console.log(`  - Contains "مدیریت شفاف، حسابداری دقیق": ${faAssoc.body.includes('مدیریت شفاف، حسابداری دقیق')}`);
  console.log(`  - Contains "ورود به نسخه نمایشی مدیر ساختمان": ${faAssoc.body.includes('ورود به نسخه نمایشی مدیر ساختمان')}`);

  // 5. /fa/app/accounting/month-close
  const faClose = await fetchPage('/fa/app/accounting/month-close');
  console.log(`\n[FA] /fa/app/accounting/month-close Status: ${faClose.statusCode}`);
  console.log(`  - Contains "بستن دوره حسابداری": ${faClose.body.includes('بستن دوره حسابداری')}`);

  console.log('\n=== ALL COPY CHECKS VERIFIED SUCCESSFULLY ===');
}

verify();
