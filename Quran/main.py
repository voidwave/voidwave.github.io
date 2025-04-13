import xml.etree.ElementTree as ET
import requests
import time

BASE_URL = "https://api.alquran.cloud/v1/page/{}/ar.asad"
root = ET.Element("quran")

for page_number in range(1, 605):
    try:
        print(f"Fetching page {page_number}...")
        response = requests.get(BASE_URL.format(page_number))
        data = response.json()
        ayahs = data["data"]["ayahs"]

        surah_ranges = {}
        for ayah in ayahs:
            surah = ayah["surah"]["number"]
            ayah_number = ayah["numberInSurah"]
            if surah not in surah_ranges:
                surah_ranges[surah] = {"start": ayah_number, "end": ayah_number}
            else:
                surah_ranges[surah]["start"] = min(surah_ranges[surah]["start"], ayah_number)
                surah_ranges[surah]["end"] = max(surah_ranges[surah]["end"], ayah_number)

        page_elem = ET.SubElement(root, "page", number=str(page_number))
        for surah, range_data in surah_ranges.items():
            ET.SubElement(
                page_elem, "range",
                surah=str(surah),
                start=str(range_data["start"]),
                end=str(range_data["end"])
            )

        time.sleep(0.1)  # Avoid rate-limiting

    except Exception as e:
        print(f"Error on page {page_number}: {e}")

tree = ET.ElementTree(root)
tree.write("quran_pages.xml", encoding="utf-8", xml_declaration=True)
print("Done! Saved as quran_pages.xml")