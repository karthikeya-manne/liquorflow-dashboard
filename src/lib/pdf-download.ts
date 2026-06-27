import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function savePdf(
  doc: any,
  fileName: string
) {
  // Web browser
  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName);
    return;
  }

  // Android / iOS
  const blob = doc.output("blob");

  const base64 = await new Promise<string>(
    (resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(
          (reader.result as string).split(",")[1]
        );
      };

      reader.readAsDataURL(blob);
    }
  );

  const file = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  await Share.share({
    title: fileName,
    url: file.uri,
  });
}