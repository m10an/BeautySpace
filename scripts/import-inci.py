"""Reproduce the MIT name catalog from its pinned, checksum-verified source.
No clinical scores are inferred from names or descriptors.
"""
import argparse, hashlib, json, unicodedata, re, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
lock=json.loads((ROOT/'data/source-lock.json').read_text())
parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path);args=parser.parse_args()
url=f"https://raw.githubusercontent.com/beauteeru/cosmetic-ingredients-dataset/{lock['commit']}/ingredients.json"
raw=args.source.read_bytes() if args.source else urllib.request.urlopen(url,timeout=40).read()
if hashlib.sha256(raw).hexdigest()!=lock['sha256']:raise SystemExit('Source checksum mismatch; do not update the expected hash to bypass verification.')
rows=json.loads(raw);names={}
def normalize(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower().replace('.','')).strip()
for row in rows:
 name=row.get('name','').strip();key=normalize(name)
 if not key or not str(row.get('substanceId','')).isdigit():raise ValueError('Invalid source record')
 names.setdefault(key,{'name':name,'cosingId':str(row['substanceId']),'cas':str(row.get('casNo','')),'synonyms':[]})
for key,aliases in {'petrolatum':['Vaseline','Petroleum jelly','White petrolatum'],'olea europaea fruit oil':['Olive oil','Olea europaea (olive) fruit oil'],'vitis vinifera seed oil':['Grape seed oil','Grapeseed oil','Vitis vinifera (grape) seed oil'],'water':['Aqua','Eau']}.items():
 if key not in names:raise ValueError(f'Missing known anchor: {key}')
 names[key]['synonyms']=aliases
if len(names)<20000:raise ValueError('Unexpectedly small source; investigate before replacing the catalog')
(ROOT/'data/ingredient-names.json').write_text(json.dumps({'version':1,'source':lock,'entries':list(names.values())},ensure_ascii=False,separators=(',',':'))+'\n')
print(f'{len(names)} unique normalized names; no clinical ratings generated.')
