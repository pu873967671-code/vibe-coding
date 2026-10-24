# Hiirusama professional shoe meshes

`classic-pump.glb`: Classic round-toe Pumps by Hiirusama, CC0 1.0.
Source: https://hiirusama.gumroad.com/l/heels_1
Original supplied source: `dev/asset_candidates/hiirusama/Classic_Pump.fbx`.

`mary-jane.glb`: Mary Jane Heels 8cm by Hiirusama, CC0 1.0.
Source: https://hiirusama.gumroad.com/l/heels_4
Original supplied source: `dev/asset_candidates/hiirusama/MaryJaneHeels.fbx`.

CC0 public domain dedication: https://creativecommons.org/publicdomain/zero/1.0/
Provenance/license designation supplied with the project in dev/asset_candidates/README.md.

Offline conversion: `python3 dev/model-tools/convert-shoes.py`. Original geometry, normals and UVs are retained, transformed to a 3-unit shoe last, split into semantic parts and indexed by welding identical vertex attributes. No textures, animations or external resources. Game materials and heel pitch/support modifications are applied at runtime. These derivatives remain CC0.
