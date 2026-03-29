/**
 * Share content via WhatsApp deep link
 */
export const shareOnWhatsApp = (text: string) => {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
};

/**
 * Format disease diagnosis for WhatsApp
 */
export const formatDiseaseForWhatsApp = (result: any, lang: string): string => {
  const lines = [
    `🌿 *कृषि सहायक — रोग जाँच रिपोर्ट*`,
    ``,
    `🦠 *रोग:* ${result.DiseaseName} (${result.DiseaseNameHindi || ''})`,
    `📊 *गंभीरता:* ${result.Severity}`,
    `📈 *विश्वसनीयता:* ${result.Confidence}`,
    ``,
    `🧪 *रासायनिक उपचार:* ${result.ChemicalCure}`,
    `📏 *मात्रा:* ${result.ChemicalDosage}`,
    ``,
    `🌿 *जैविक विकल्प:* ${result.OrganicAlternative}`,
    `📋 *तरीका:* ${result.OrganicMethod}`,
    ``,
    `🛡️ *रोकथाम:*`,
    ...(result.Prevention || []).map((p: string, i: number) => `${i + 1}. ${p}`),
    ``,
    `⚡ *तुरंत करें:* ${result.ImmediateAction}`,
    ``,
    `🤖 _AI द्वारा उत्पन्न — कृपया स्थानीय कृषि विशेषज्ञ से पुष्टि करें_`,
    `📲 Krishi Sahayak App से`,
  ];
  return lines.join('\n');
};

/**
 * Format crop recommendation for WhatsApp
 */
export const formatCropForWhatsApp = (crop: any): string => {
  return [
    `🌾 *कृषि सहायक — फसल सिफारिश*`,
    ``,
    `${crop.Emoji} *${crop.CropName}* (${crop.CropNameHindi})`,
    `📊 मिलान: ${crop.Confidence}`,
    ``,
    `📈 उपज/एकड़: ${crop.YieldPerAcre}`,
    `💰 अनुमानित लाभ: ${crop.EstimatedProfit}`,
    `📅 बुवाई: ${crop.BestSowingTime}`,
    `💧 पानी: ${crop.WaterRequirement}`,
    `🏛️ योजना: ${crop.GovernmentScheme || 'N/A'}`,
    ``,
    `💡 *सुझाव:*`,
    ...(crop.KeyTips || []).map((t: string, i: number) => `${i + 1}. ${t}`),
    ``,
    `📲 Krishi Sahayak App से`,
  ].join('\n');
};

/**
 * Use native share API or fallback to WhatsApp
 */
export const shareContent = async (title: string, text: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch { /* fallback */ }
  }
  shareOnWhatsApp(text);
};
