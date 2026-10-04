/**
 * Classifier Unit Tests
 * Fulfills Section S8: >= 25 test cases, >= 8 Hindi, tie-breaks, celebrity tag, city match.
 */
import { describe, it, expect } from 'vitest';
import { classifyArticle, tokenize } from '../services/classifier';

describe('Classifier Engine', () => {
  it('tokenizes English text with punctuation correctly', () => {
    const tokens = tokenize('Supreme Court orders hospital fire-safety review!');
    expect(tokens).toContain('supreme');
    expect(tokens).toContain('court');
    expect(tokens).toContain('hospital');
  });

  it('tokenizes Devanagari text with danda correctly', () => {
    const tokens = tokenize('सुप्रीम कोर्ट ने दिया बड़ा आदेश। जांच शुरू हुई।');
    expect(tokens).toContain('सुप्रीम');
    expect(tokens).toContain('कोर्ट');
    expect(tokens).toContain('आदेश');
  });

  // Test Case 1: Politics English
  it('classifies general election and parliament news as politics', () => {
    const res = classifyArticle({
      title: 'Parliament passes new bill during winter session',
      summary: 'Ministers and opposition debate election reforms.',
      language: 'en'
    });
    expect(res.category).toBe('politics');
  });

  // Test Case 2: Politics Hindi
  it('classifies Hindi election and assembly news as politics', () => {
    const res = classifyArticle({
      title: 'विधानसभा चुनाव के लिए भाजपा और कांग्रेस का प्रचार तेज',
      summary: 'मुख्यमंत्री ने विपक्ष पर साधा निशाना, मतदान की तैयारियां पूरी।',
      language: 'hi'
    });
    expect(res.category).toBe('politics');
  });

  // Test Case 3: Sports English
  it('classifies cricket tournament news as sports', () => {
    const res = classifyArticle({
      title: 'Rohit Sharma scores century in IPL match against Chennai',
      summary: 'The batsman hit five sixes to guide his team to victory.',
      language: 'en'
    });
    expect(res.category).toBe('sports');
  });

  // Test Case 4: Sports Hindi
  it('classifies Hindi cricket news as sports', () => {
    const res = classifyArticle({
      title: 'भारतीय क्रिकेट टीम ने जीता मुकाबला, कोहली का शानदार शतक',
      summary: 'गेंदबाजों ने चटकाए चार विकेट, फाइनल में पहुंची टीम।',
      language: 'hi'
    });
    expect(res.category).toBe('sports');
  });

  // Test Case 5: Protests English
  it('classifies farmers agitation and dharna as protests', () => {
    const res = classifyArticle({
      title: 'Protesters hold massive chakka jam and rally at border',
      summary: 'Farmers protest leaders call for nationwide bandh and strike.',
      language: 'en'
    });
    expect(res.category).toBe('protests');
  });

  // Test Case 6: Protests Hindi
  it('classifies Hindi farmers protest and strike as protests', () => {
    const res = classifyArticle({
      title: 'किसान आंदोलन: प्रदर्शनकारियों ने निकाला विशाल मार्च और धरना',
      summary: 'संयुक्त मोर्चा ने किया भारत बंद का ऐलान, हाईवे पर चक्का जाम।',
      language: 'hi'
    });
    expect(res.category).toBe('protests');
  });

  // Test Case 7: Business English
  it('classifies Sensex, RBI, and inflation news as business', () => {
    const res = classifyArticle({
      title: 'Sensex surges 600 points as RBI keeps repo rate steady',
      summary: 'Stock market gains amidst favorable GDP growth and inflation data.',
      language: 'en'
    });
    expect(res.category).toBe('business');
  });

  // Test Case 8: Business Hindi
  it('classifies Hindi share market and budget news as business', () => {
    const res = classifyArticle({
      title: 'शेयर बाजार में रिकॉर्ड तेजी, सेंसेक्स और निफ्टी नए शिखर पर',
      summary: 'आरबीआई ने ब्याज दरों में नहीं किया बदलाव, अर्थव्यवस्था मजबूत।',
      language: 'hi'
    });
    expect(res.category).toBe('business');
  });

  // Test Case 9: Technology English
  it('classifies ISRO and AI smartphone news as tech', () => {
    const res = classifyArticle({
      title: 'ISRO launches advanced Earth satellite with AI software',
      summary: 'The semiconductor chip and algorithm improve cybersecurity.',
      language: 'en'
    });
    expect(res.category).toBe('tech');
  });

  // Test Case 10: Technology Hindi
  it('classifies Hindi ISRO satellite news as tech', () => {
    const res = classifyArticle({
      title: 'इसरो ने श्रीहरिकोटा से लॉन्च किया नया उपग्रह और सैटेलाइट',
      summary: 'कृत्रिम बुद्धिमत्ता और आधुनिक सॉफ्टवेयर से लैस है नया सिस्टम।',
      language: 'hi'
    });
    expect(res.category).toBe('tech');
  });

  // Test Case 11: Crime English
  it('classifies police arrest and court bail news as crime', () => {
    const res = classifyArticle({
      title: 'Police arrest three accused in financial scam probe',
      summary: 'High Court rejects bail application following FIR filing.',
      language: 'en'
    });
    expect(res.category).toBe('crime');
  });

  // Test Case 12: Crime Hindi
  it('classifies Hindi police FIR and court news as crime', () => {
    const res = classifyArticle({
      title: 'पुलिस ने धोखाधड़ी और लूट के आरोपी को किया गिरफ्तार',
      summary: 'अदालत ने खारिज की जमानत याचिका, दर्ज हुई थी एफआईआर।',
      language: 'hi'
    });
    expect(res.category).toBe('crime');
  });

  // Test Case 13: Health English
  it('classifies hospital vaccine and virus news as health', () => {
    const res = classifyArticle({
      title: 'AIIMS doctors report progress in dengue vaccine clinical trials',
      summary: 'Hospital treats patients recovering from seasonal infection.',
      language: 'en'
    });
    expect(res.category).toBe('health');
  });

  // Test Case 14: Health Hindi
  it('classifies Hindi hospital and disease news as health', () => {
    const res = classifyArticle({
      title: 'एम्स के डॉक्टरों ने तैयार किया नया टीका और दवा',
      summary: 'अस्पताल में डेंगू और गंभीर बीमारी से पीड़ित मरीजों का इलाज जारी।',
      language: 'hi'
    });
    expect(res.category).toBe('health');
  });

  // Test Case 15: World English
  it('classifies UN summit and foreign diplomacy as world', () => {
    const res = classifyArticle({
      title: 'United Nations summit convenes in Geneva to discuss ceasefire treaty',
      summary: 'Delegates from Europe and global nations negotiate bilateral peace.',
      language: 'en'
    });
    expect(res.category).toBe('world');
  });

  // Test Case 16: World Hindi
  it('classifies Hindi international diplomacy as world', () => {
    const res = classifyArticle({
      title: 'संयुक्त राष्ट्र शिखर सम्मेलन में युद्ध विराम पर सहमति',
      summary: 'अमेरिका और यूरोपीय देशों ने वैश्विक कूटनीति पर दिया बल।',
      language: 'hi'
    });
    expect(res.category).toBe('world');
  });

  // Test Case 17: Celebrity Sub-tag Check (Shah Rukh Khan)
  it('adds celebrity and entertainment tag when a known celebrity is mentioned', () => {
    const res = classifyArticle({
      title: 'Shah Rukh Khan greets fans outside Mannat ahead of new film premiere',
      summary: 'The actor thanked supporters for overwhelming box office numbers.',
      language: 'en'
    });
    expect(res.tags).toContain('celebrity');
    expect(res.tags).toContain('entertainment');
  });

  // Test Case 18: Celebrity in Sports (Virat Kohli)
  it('correctly adds celebrity tag to sports story featuring Virat Kohli', () => {
    const res = classifyArticle({
      title: 'Virat Kohli hits century to guide Royal Challengers in IPL thriller',
      summary: 'The cricket batsman received player of the match honours.',
      language: 'en'
    });
    expect(res.category).toBe('sports');
    expect(res.tags).toContain('celebrity');
  });

  // Test Case 19: City Matching (Ludhiana)
  it('matches Ludhiana city from text', () => {
    const res = classifyArticle({
      title: 'New industrial hub planned near Ludhiana highway',
      summary: 'Punjab government announces infrastructure investment.',
      language: 'en'
    });
    expect(res.cities).toContain('Ludhiana');
  });

  // Test Case 20: City Matching Hindi (मुंबई)
  it('matches Mumbai in Hindi from Devanagari alias', () => {
    const res = classifyArticle({
      title: 'मुंबई में भारी बारिश के बाद उपनगरीय ट्रेन सेवाएं प्रभावित',
      summary: 'मौसम विभाग ने जारी किया रेड अलर्ट।',
      language: 'hi'
    });
    expect(res.cities).toContain('Mumbai');
  });

  // Test Case 21: Feed Hint Fallback
  it('uses feed category hint when keyword score is low', () => {
    const res = classifyArticle({
      title: 'A regular daily summary of events and observations',
      summary: 'Brief notes on morning happenings.',
      language: 'en',
      feedCategoryHint: 'business'
    });
    expect(res.category).toBe('business');
  });

  // Test Case 22: Low score without hint defaults to "top"
  it('defaults to top when score < 2 and no hint is given', () => {
    const res = classifyArticle({
      title: 'Morning sun shines on pleasant meadow',
      summary: 'Quiet breeze passes through the trees.',
      language: 'en'
    });
    expect(res.category).toBe('top');
  });

  // Test Case 23: Multiple tags
  it('populates multiple tags when multiple categories score >= 2', () => {
    const res = classifyArticle({
      title: 'Parliament debates AI regulation and cybersecurity laws',
      summary: 'Ministers discuss software startup innovation alongside privacy.',
      language: 'en'
    });
    expect(res.tags).toContain('politics');
    expect(res.tags).toContain('tech');
  });

  // Test Case 24: Hindi Celebrity Check (दीपिका पादुकोण)
  it('detects celebrity in Hindi cinema story', () => {
    const res = classifyArticle({
      title: 'दीपिका पादुकोण और रणवीर सिंह ने किया नई फिल्म का ऐलान',
      summary: 'बॉलीवुड कलाकारों ने सोशल मीडिया पर साझा की जानकारी।',
      language: 'hi'
    });
    expect(res.tags).toContain('celebrity');
    expect(res.category).toBe('entertainment');
  });

  // Test Case 25: Delhi alias match
  it('matches Delhi from NCR alias', () => {
    const res = classifyArticle({
      title: 'Pollution levels drop in NCR after evening showers',
      summary: 'Air quality index improves across major transit corridors.',
      language: 'en'
    });
    expect(res.cities).toContain('Delhi');
  });
});
