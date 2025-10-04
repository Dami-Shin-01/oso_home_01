// Supabase Storage에 Unsplash 이미지 업로드
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://nrblnfmknolgsqpcqite.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYmxuZm1rbm9sZ3NxcGNxaXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg3ODc0MSwiZXhwIjoyMDcyNDU0NzQxfQ.Qv4SqwA9syrS6Xd1SGvOwwbJVsIbK-7fKvubvIuXyQM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Unsplash 이미지 URL (무료, 상업적 사용 가능)
const images = [
  {
    url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=400&fit=crop',
    name: 'reservation-icon.jpg',
    alt: '간편한 예약'
  },
  {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
    name: 'nature-icon.jpg',
    alt: '최고의 자연환경'
  },
  {
    url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=400&fit=crop',
    name: 'facility-icon.jpg',
    alt: '완벽한 시설'
  }
];

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function uploadImages() {
  console.log('Starting upload process...');

  // 1. 버킷 생성 (이미 존재하면 에러 무시)
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'feature-icons');

  if (!bucketExists) {
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('feature-icons', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });

    if (bucketError) {
      console.error('Error creating bucket:', bucketError);
      return;
    }
    console.log('✅ Bucket created successfully');
  } else {
    console.log('✅ Bucket already exists');
  }

  // 2. 이미지 다운로드 및 업로드
  for (const image of images) {
    try {
      console.log(`\nDownloading ${image.name}...`);
      const buffer = await downloadImage(image.url);

      console.log(`Uploading ${image.name} to Supabase Storage...`);
      const { data, error } = await supabase.storage
        .from('feature-icons')
        .upload(image.name, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error(`Error uploading ${image.name}:`, error);
      } else {
        // Public URL 생성
        const { data: publicUrlData } = supabase.storage
          .from('feature-icons')
          .getPublicUrl(image.name);

        console.log(`✅ ${image.name} uploaded successfully`);
        console.log(`   Public URL: ${publicUrlData.publicUrl}`);
      }
    } catch (error) {
      console.error(`Error processing ${image.name}:`, error);
    }
  }

  console.log('\n🎉 All images uploaded successfully!');
}

uploadImages().catch(console.error);
