import zipfile, os
zip_path = '/home/cooywjw/hermes-main.zip'
extract_to = '/home/cooywjw/'
with zipfile.ZipFile(zip_path) as z:
    z.extractall(extract_to)
print('Extracted:', os.listdir('/home/cooywjw/'))
