import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Ruler, CircleHelp } from "lucide-react";

interface SizeGuideProps {
  type?: "ring" | "bracelet" | "necklace";
  trigger?: React.ReactNode;
}

const SizeGuide = ({ type = "ring", trigger }: SizeGuideProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary underline-offset-4 hover:underline flex items-center gap-1"
          >
            <CircleHelp className="h-4 w-4 mr-1" />
            {t("size_guide")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">{t("size_guide")}</DialogTitle>
          <DialogDescription>
            {t("size_guide_description")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={type} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ring">{t("rings")}</TabsTrigger>
            <TabsTrigger value="bracelet">{t("bracelets")}</TabsTrigger>
            <TabsTrigger value="necklace">{t("necklaces")}</TabsTrigger>
          </TabsList>

          <TabsContent value="ring" className="pt-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2 text-lg">
                  {t("how_to_measure_ring")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-foreground/80">{t("ring_measure_description")}</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>{t("ring_measure_step_1")}</li>
                      <li>{t("ring_measure_step_2")}</li>
                      <li>{t("ring_measure_step_3")}</li>
                    </ol>
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src="/images/ring-sizing.jpg" 
                      alt={t("ring_sizing")} 
                      className="max-h-40 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/200x150?text=Ring+Sizing";
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4 text-lg flex items-center">
                  <Ruler className="mr-2 h-5 w-5 text-primary" />
                  {t("ring_size_chart")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium">{t("israel_size")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("us_size")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("eu_size")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("diameter_mm")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { il: "45", us: "3", eu: "44", mm: "14.5" },
                        { il: "47", us: "4", eu: "47", mm: "15.0" },
                        { il: "50", us: "5", eu: "49", mm: "15.7" },
                        { il: "52", us: "6", eu: "51", mm: "16.2" },
                        { il: "54", us: "7", eu: "54", mm: "16.8" },
                        { il: "56", us: "7.5", eu: "56", mm: "17.3" },
                        { il: "58", us: "8", eu: "57", mm: "17.8" },
                        { il: "60", us: "9", eu: "59", mm: "18.5" },
                        { il: "62", us: "10", eu: "62", mm: "19.4" },
                        { il: "64", us: "11", eu: "64", mm: "20.3" },
                      ].map((size, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="py-2 px-3">{size.il}</td>
                          <td className="py-2 px-3">{size.us}</td>
                          <td className="py-2 px-3">{size.eu}</td>
                          <td className="py-2 px-3">{size.mm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">{t("ring_size_tips")}</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>{t("ring_tip_1")}</li>
                  <li>{t("ring_tip_2")}</li>
                  <li>{t("ring_tip_3")}</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bracelet" className="pt-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2 text-lg">
                  {t("how_to_measure_bracelet")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-foreground/80">{t("bracelet_measure_description")}</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>{t("bracelet_measure_step_1")}</li>
                      <li>{t("bracelet_measure_step_2")}</li>
                      <li>{t("bracelet_measure_step_3")}</li>
                    </ol>
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src="/images/bracelet-sizing.jpg" 
                      alt={t("bracelet_sizing")} 
                      className="max-h-40 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/200x150?text=Bracelet+Sizing";
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4 text-lg flex items-center">
                  <Ruler className="mr-2 h-5 w-5 text-primary" />
                  {t("bracelet_size_chart")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium">{t("size")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("wrist_cm")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("bracelet_cm")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("bracelet_in")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: "XS", wrist: "13-14", bracelet: "15-16", inch: "5.9-6.3" },
                        { size: "S", wrist: "14-15", bracelet: "16-17", inch: "6.3-6.7" },
                        { size: "M", wrist: "15-16", bracelet: "17-18", inch: "6.7-7.1" },
                        { size: "L", wrist: "16-17", bracelet: "18-19", inch: "7.1-7.5" },
                        { size: "XL", wrist: "17-18", bracelet: "19-20", inch: "7.5-7.9" },
                        { size: "XXL", wrist: "18-19", bracelet: "20-21", inch: "7.9-8.3" },
                      ].map((size, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="py-2 px-3">{size.size}</td>
                          <td className="py-2 px-3">{size.wrist}</td>
                          <td className="py-2 px-3">{size.bracelet}</td>
                          <td className="py-2 px-3">{size.inch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">{t("bracelet_size_tips")}</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>{t("bracelet_tip_1")}</li>
                  <li>{t("bracelet_tip_2")}</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="necklace" className="pt-4">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2 text-lg">
                  {t("how_to_measure_necklace")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-foreground/80">{t("necklace_measure_description")}</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>{t("necklace_measure_step_1")}</li>
                      <li>{t("necklace_measure_step_2")}</li>
                    </ol>
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src="/images/necklace-sizing.jpg" 
                      alt={t("necklace_sizing")} 
                      className="max-h-40 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/200x150?text=Necklace+Sizing";
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4 text-lg flex items-center">
                  <Ruler className="mr-2 h-5 w-5 text-primary" />
                  {t("necklace_size_chart")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium">{t("type")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("length_cm")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("length_in")}</th>
                        <th className="text-right py-2 px-3 font-medium">{t("style")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: "Choker", cm: "35-41", inch: "14-16", style: t("tight_around_neck") },
                        { type: "Princess", cm: "42-48", inch: "16-18", style: t("common_standard_length") },
                        { type: "Matinee", cm: "50-60", inch: "20-24", style: t("single_strand_below_collarbone") },
                        { type: "Opera", cm: "70-86", inch: "28-34", style: t("longer_necklace_below_bust") },
                        { type: "Rope", cm: "115+", inch: "45+", style: t("longest_style_can_be_wrapped") },
                      ].map((size, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="py-2 px-3">{size.type}</td>
                          <td className="py-2 px-3">{size.cm}</td>
                          <td className="py-2 px-3">{size.inch}</td>
                          <td className="py-2 px-3">{size.style}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">{t("necklace_size_tips")}</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>{t("necklace_tip_1")}</li>
                  <li>{t("necklace_tip_2")}</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SizeGuide;