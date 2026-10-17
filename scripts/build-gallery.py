#!/usr/bin/env python3
"""Build 24-photo preview sheets and seekable ZIP albums from downloaded JPEGs.

Usage: python scripts/build-gallery.py INVENTORY_JSON SOURCE_DIR
Inventory: [{id, name, size}]. Originals remain byte-for-byte identical in ZIPs.
Only the public metadata (filename, dimensions, byte location) enters the site.
"""
import sys,json,zipfile,hashlib
from pathlib import Path
from PIL import Image,ImageOps
inventory=json.loads(Path(sys.argv[1]).read_text());source=Path(sys.argv[2]);root=Path(__file__).resolve().parents[1]
assert len(inventory)==1020 and len({x['id'] for x in inventory})==1020,'Expected exactly 1,020 unique source photos'
output=root/'public/photos/2026';(output/'albums').mkdir(parents=True,exist_ok=True);(output/'previews').mkdir(exist_ok=True)
manifest=[];audit=[]
for index in range(0,len(inventory),12):
 archive_name=f'album-{index//12+1:02}.zip';archive=output/'albums'/archive_name
 temporary_archive=archive.with_suffix('.zip.tmp')
 with zipfile.ZipFile(temporary_archive,'w',compression=zipfile.ZIP_STORED) as z:
  for position,item in enumerate(inventory[index:index+12],index):
   data=(source/(item['id']+'.jpg')).read_bytes()
   assert len(data)==item['size'] and data[:2]==b'\xff\xd8' and data[-2:]==b'\xff\xd9',item['name']
   with Image.open(source/(item['id']+'.jpg')) as image:width,height=ImageOps.exif_transpose(image).size
   assert Path(item['name']).name==item['name'],'Unexpected source filename'
   z.writestr(zipfile.ZipInfo(item['name'],date_time=(1980,1,1,0,0,0)),data)
   info=z.getinfo(item['name']);offset=info.header_offset+30+len(info.filename.encode('utf-8'))+len(info.extra)
   manifest.append(dict(number=position+1,filename=item['name'],archive=f'/photos/2026/albums/{archive_name}',offset=offset,length=len(data),width=width,height=height))
   audit.append(dict(number=position+1,driveId=item['id'],sha256=hashlib.sha256(data).hexdigest()))
 temporary_archive.replace(archive)
 # Verify every byte range against its original before publishing.
 packed=archive.read_bytes()
 for record,item in zip(manifest[index:index+12],inventory[index:index+12]):
  assert packed[record['offset']:record['offset']+record['length']]==(source/(item['id']+'.jpg')).read_bytes(),item['name']
for index in range(0,len(inventory),24):
 sheet=Image.new('RGB',(1800,800),'#172033')
 for tile,item in enumerate(inventory[index:index+24]):
  with Image.open(source/(item['id']+'.jpg')) as image:
   thumb=ImageOps.fit(ImageOps.exif_transpose(image).convert('RGB'),(300,200),method=Image.Resampling.LANCZOS)
   sheet.paste(thumb,((tile%6)*300,(tile//6)*200))
 target=output/'previews'/f'page-{index//24+1:02}.webp'
 temporary=target.with_suffix('.webp.tmp')
 sheet.save(temporary,format='WEBP',quality=78,method=6)
 with Image.open(temporary) as verified:verified.load()
 temporary.replace(target)
(root/'data/photos-2026.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
(source.parent/'source-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps({'photos':len(manifest),'albums':85,'previewPages':43,'jpegBytes':sum(x['length'] for x in manifest),'largestPreviewBytes':max(x.stat().st_size for x in (output/'previews').glob('*.webp'))}))
