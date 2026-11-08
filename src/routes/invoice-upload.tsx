import { createFileRoute } from "@tanstack/react-router";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

  import {
    createProduct,
    importInvoice,
    listInvoices,
    listProducts,
  } from "@/lib/api/liquorflow";
  import { getCurrentShopId } from "@/lib/currentShop";

  import { useRef } from "react";

  import { productMapping }
from "../data/productMapping";

import toast from "react-hot-toast";



export const Route =
  createFileRoute("/invoice-upload")({
    ssr: false,
    component: InvoiceUploadPage,
  });

function InvoiceUploadPage() {

  const [missingProducts,
    setMissingProducts] =
    useState<any[]>([]);

  const [invoiceNumber, setInvoiceNumber] =
  useState("");

  const [selectedFileName, setSelectedFileName] =
  useState("");
    
  const fileInputRef =
  useRef<HTMLInputElement>(null);

  const [invoiceItems, setInvoiceItems] =
  useState<any[]>([]);

  const [showAddProductModal,
    setShowAddProductModal] =
    useState(false);
  
  const [selectedProduct,
    setSelectedProduct] =
    useState<any>(null);
  
  const [newProductPrice,
    setNewProductPrice] =
    useState("");
  
  const [newProductCategory,
    setNewProductCategory] =
    useState("");
  
  const [newProductName,
    setNewProductName] =
    useState("");

    const [openingStock,
      setOpeningStock] =
      useState(0);

      const [uploading,
        setUploading] =
        useState(false);

        

  async function handlePdfUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    
  
    const file =
      event.target.files?.[0];
  
    if (!file) return;
  
    setSelectedFileName(
      file.name
    );
  
    let fullText = "";

    try {

      const arrayBuffer =
        await file.arrayBuffer();
    
      const pdfjsLib =
        await import(
          "pdfjs-dist/legacy/build/pdf"
        );
    
      const worker = (
        await import(
          "pdfjs-dist/build/pdf.worker.min.mjs?url"
        )
      ).default;
    
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        worker;
    
      const pdf =
        await pdfjsLib.getDocument({
          data: arrayBuffer,
        }).promise;

      for (
        let pageNum = 1;
        pageNum <= pdf.numPages;
        pageNum++
      ) {
        const page =
          await pdf.getPage(pageNum);

        const content =
          await page.getTextContent();

        const pageText =
          content.items
            .map(
              (item: any) =>
                item.str
            )
            .join(" ");

        fullText +=
          pageText + "\n";
      }
    
    } catch (err) {
    
      console.error(err);
    
      toast.error(
        "Unable to read PDF"
      );
    
      return;
    
    }
    console.log(
      "PDF TEXT:",
      fullText
    );

    const invoiceMatch =
  fullText.match(
    /ICDC\d+/i
  );

if (invoiceMatch) {

  setInvoiceNumber(
    invoiceMatch[0]
  );

}

    console.log(productMapping);
    const foundProducts: any[] = [];

    const missing: any[] = [];

    const regex =
/(\d{4})\s+([A-Z0-9`'.&\-\s]+?)\s+(Beer|IML)\s+([A-Z])\s+(\d+)\s*\/\s*(\d+)\s*ml\s+(\d+)\s+(\d+)/g;
const shopId = getCurrentShopId();
const inventoryProducts = await listProducts(shopId);

    
    let match;
    
    while (
      (match = regex.exec(fullText))
      !== null
    ) {
    
      const packQty =
  Number(match[5]);

const sizeMl =
  Number(match[6]);


if (
  packQty === 1 &&
  sizeMl >= 30000
) {
  continue;
}

const qty =
Number(match[7]);

const bottles =
  Number(match[8]);

      const invoiceName =
  match[2]
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

console.log(
  "EXTRACTED:",
  JSON.stringify(invoiceName)
);
    


        const fullMatch =
  match[0];

if (
  fullMatch.includes("1 / 30000 ml")
) {
  continue;
}
    
const normalizedName =
  invoiceName
    .replace(/\s+/g, " ")
    .trim();

let inventoryName =
  normalizedName;

for (const key in productMapping) {

  if (
    normalizedName.includes(key) ||
    key.includes(normalizedName)
  ) {

    inventoryName =
      productMapping[key as keyof typeof productMapping];

    break;

  }

}

if (
  match[3] === "Beer" &&
  packQty === 24 &&
  sizeMl === 500
) {

  inventoryName =
    "Beer Tin";

}

        console.log(
          "[" + invoiceName + "]",
          "=>",
          productMapping[invoiceName as keyof typeof productMapping]
        );

        const existsInInventory =
  inventoryProducts.some(
    (p) =>
      p.name ===
      inventoryName
  );

if (!existsInInventory) {

  missing.push({

    invoiceName,

    inventoryName,

    qty,

  });

  continue;

}
    
      // STEP 5
      foundProducts.push({

        invoiceName,
      
        inventoryName,
      
        qty,
      
        bottles,
      
        packQty,
      
        sizeMl,
      
      });
    
    }
    
    setInvoiceItems(
      foundProducts
    );

    setMissingProducts(
      missing
    );
    

  
    console.log(
      "FOUND PRODUCTS:",
      foundProducts
    );
  
  }

  async function refillInventory() {

    setUploading(true);

    let shopId: string;
    try {
      shopId = getCurrentShopId();
    } catch {
      toast.error("Shop not found");
      setUploading(false);
      return;
    }

    if (!invoiceNumber) {

      toast.error(
        "Invoice number not found"
      );
      setUploading(false);
      return;
    
    }

    const existingInvoices = await listInvoices(shopId);
    if (existingInvoices.some((inv) => inv.invoiceNumber === invoiceNumber)) {
      toast.error("Invoice already processed");
      setUploading(false);
      return;
    }

    const { totalStock } = await importInvoice(shopId, {
      invoiceNumber,
      items: invoiceItems,
    });

    const today = new Date().toISOString().split("T")[0];

localStorage.setItem(
  `openingStock-${today}`,
  totalStock.toString()
);

localStorage.setItem(
  `closingStock-${today}`,
  totalStock.toString()
);

setOpeningStock(
  totalStock
);



toast.success(
      "Inventory Refilled Successfully"
    );
    setUploading(false);
    setInvoiceItems([]);
    if (fileInputRef.current) {

      fileInputRef.current.value = "";
    
    }
  }

  async function saveProduct() {

    const shopId = getCurrentShopId();

    await createProduct(shopId, {
      name: newProductName,
      category: newProductCategory,
      price: Number(newProductPrice),
      quantity: 0,
    });
  
    toast.success(
      "Product Added Successfully"
    );
  
    setShowAddProductModal(
      false
    );
  
    setMissingProducts(
      prev =>
        prev.filter(
          p =>
            p.invoiceName !==
            selectedProduct.invoiceName
        )
    );
  
  }

  return (

    <div className="min-h-screen bg-black text-white flex">
  
      <Sidebar />
  
      <div className="flex-1 p-6 pt-24">
  
        <h1 className="text-5xl font-bold mb-8">
          Invoice Upload 
        </h1>
  
        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
  
          <h2 className="text-2xl font-bold mb-6">
            Upload Supplier Invoice
          </h2>
  
          <div className="mt-4">
  
            <label
              htmlFor="pdfUpload"
              className="
                cursor-pointer
                inline-flex
                items-center
                gap-3
                bg-orange-500
                hover:bg-orange-600
                px-6
                py-3
                rounded-xl
                font-semibold
                transition-all
              "
            >
               Upload Invoice
            </label>
  
            <input
              id="pdfUpload"
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
  
            {selectedFileName && (
  
              <p className="mt-3 text-zinc-400">
  
                Selected:
                {" "}
                {selectedFileName}
  
              </p>
  
            )}
  
          </div>
  
          {invoiceItems.length > 0 && (
  
            <div className="
              mt-8
              bg-zinc-800
              p-6
              rounded-xl
            ">
  
              <h2 className="
                text-2xl
                font-bold
                mb-4
              ">
                Products Found
              </h2>
  
              {invoiceItems.map(
                (item, index) => (
  
                  <div
                    key={index}
                    className="
                      py-3
                      border-b
                      border-zinc-700
                      flex
                      justify-between
                    "
                  >
  
                    <div>
  
                      <div>
                        {item.inventoryName}
                      </div>
  
                      <div className="
                        text-xs
                        text-zinc-400
                      ">
                        {item.invoiceName}
                      </div>
  
                    </div>
  
                    <span className="text-green-400">
                    {item.qty} Cases
{item.bottles > 0 &&
  ` + ${item.bottles} Bottles`
}
                    </span>
  
                  </div>
  
                )
              )}
               <div className="
  mt-6
  bg-zinc-900
  p-4
  rounded-xl
">
{invoiceNumber && (

<div className="
  mt-6
  bg-zinc-800
  p-4
  rounded-xl
">

  <p className="font-semibold">

    Invoice Number:
    {" "}
    {invoiceNumber}

  </p>

</div>

)}
  <p>
    Products Found:
    {invoiceItems.length}
  </p>

  <p>
    Total Cases:
    {
      invoiceItems.reduce(
        (sum, item) =>
          sum + item.qty,
        0
      )
    }
  </p>

</div>
{missingProducts.length > 0 && (

<div className="
  mt-8
  bg-red-950
  p-6
  rounded-xl
">

  <h2 className="
    text-xl
    font-bold
    mb-4
    text-red-400
  ">
    Missing Products
  </h2>

  {missingProducts.map(
    (product, index) => (

      <div
        key={index}
        className="
          py-2
          flex
          justify-between
        "
      >

        <span>
          {product.invoiceName}
        </span>

        <button
  onClick={() => {

    setSelectedProduct(
      product
    );

    setNewProductName(
      product.inventoryName
    );

    setShowAddProductModal(
      true
    );

  }}
  className="
    bg-orange-500
    px-3
    py-1
    rounded-lg
  "
>
  Add Product
</button>

      </div>

    )
  )}

</div>

)}
              <button
  onClick={refillInventory}
  disabled={uploading}
  className="
    mt-6
    bg-green-500
    hover:bg-green-600
    px-6
    py-3
    rounded-xl
    font-bold
    disabled:opacity-50
  "
>
  {
    uploading
      ? "Refilling..."
      : " Refill Inventory"
  }
</button>
  
            </div>
  
          )}
  
        </div>
  
      </div>

      {showAddProductModal && (

<div className="
fixed
inset-0
bg-black/70
flex
items-center
justify-center
z-50
">

<div className="
bg-zinc-900
p-6
rounded-xl
w-[450px]
">

<h2 className="
text-2xl
font-bold
mb-4
">
Add Product
</h2>

<input
value={newProductName}
onChange={(e) =>
  setNewProductName(
    e.target.value
  )
}
placeholder="Product Name"
className="
w-full
p-3
mb-3
bg-zinc-800
rounded-lg
"
/>

<select
value={newProductCategory}
onChange={(e) =>
  setNewProductCategory(
    e.target.value
  )
}
className="
w-full
p-3
mb-3
bg-zinc-800
rounded-lg
"
>

<option value="">
  Select Category
</option>

<option value="Beer">
  Beer
</option>

<option value="Whisky">
  Whisky
</option>

<option value="Brandy">
  Brandy
</option>

<option value="Rum">
  Rum
</option>

<option value="Vodka">
  Vodka
</option>

<option value="Wine">
  Wine
</option>

<option value="Breezer">
  Breezer
</option>

<option value="Others">
  Others
</option>

</select>

<input
type="number"
value={newProductPrice}
onChange={(e) =>
  setNewProductPrice(
    e.target.value
  )
}
placeholder="Selling Price"
className="
w-full
p-3
mb-4
bg-zinc-800
rounded-lg
"
/>

<div className="
flex
gap-3
">

<button
onClick={saveProduct}
className="
bg-green-500
px-4
py-2
rounded-lg
font-bold
"
>

Save Product

</button>

<button
onClick={() =>
setShowAddProductModal(
false
)
}
className="
bg-red-500
px-4
py-2
rounded-lg
font-bold
"
>

Cancel

</button>

</div>

</div>

</div>

)}
  
    </div>
  
  );

}