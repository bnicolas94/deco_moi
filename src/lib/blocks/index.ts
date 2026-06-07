import { z } from 'zod';

export type BlockType = 
  | 'hero' 
  | 'richtext' 
  | 'image_text' 
  | 'features' 
  | 'faq' 
  | 'spacer' 
  | 'contact_form' 
  | 'product_grid'
  | 'testimonials'
  | 'whatsapp_cta';

const BaseBlockSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0),
  isVisible: z.boolean().default(true),
});

export const HeroBlockSchema = BaseBlockSchema.extend({
  type: z.literal('hero'),
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    overlayOpacity: z.number().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    minHeight: z.number().optional(),
  })
});

export const RichTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('richtext'),
  props: z.object({
    content: z.string(),
    maxWidth: z.enum(['narrow', 'normal', 'wide']).optional(),
    align: z.enum(['left', 'center', 'right', 'justify']).optional(),
  })
});

export const ImageTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('image_text'),
  props: z.object({
    title: z.string().optional(),
    content: z.string(),
    image: z.string(),
    imagePosition: z.enum(['left', 'right']).optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    backgroundColor: z.string().optional(),
  })
});

export const FeaturesBlockSchema = BaseBlockSchema.extend({
  type: z.literal('features'),
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    features: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      image: z.string().optional(),
    })).optional(),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    backgroundColor: z.string().optional(),
  })
});

export const FaqBlockSchema = BaseBlockSchema.extend({
  type: z.literal('faq'),
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    items: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  })
});

export const ProductGridBlockSchema = BaseBlockSchema.extend({
  type: z.literal('product_grid'),
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    categoryIds: z.array(z.number()).optional(),
    limit: z.number().optional(),
    showCta: z.boolean().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
  })
});

export const TestimonialsBlockSchema = BaseBlockSchema.extend({
  type: z.literal('testimonials'),
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    testimonials: z.array(z.object({
      name: z.string(),
      role: z.string().optional(),
      content: z.string(),
      image: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
    })).optional(),
    backgroundColor: z.string().optional(),
  })
});

export const WhatsappCtaBlockSchema = BaseBlockSchema.extend({
  type: z.literal('whatsapp_cta'),
  props: z.object({
    title: z.string().optional(),
    phoneNumber: z.string().optional(),
    message: z.string().optional(),
    buttonText: z.string().optional(),
    backgroundColor: z.string().optional(),
  })
});

export const ContactFormBlockSchema = BaseBlockSchema.extend({
  type: z.literal('contact_form'),
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    emailTo: z.string().optional(),
    backgroundColor: z.string().optional(),
  })
});

export const SpacerBlockSchema = BaseBlockSchema.extend({
  type: z.literal('spacer'),
  props: z.object({
    height: z.number().optional(),
    showLine: z.boolean().optional(),
    lineColor: z.string().optional(),
  })
});

// Discriminated union para validar todos los bloques dinámicamente
export const PageBlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  RichTextBlockSchema,
  ImageTextBlockSchema,
  FeaturesBlockSchema,
  FaqBlockSchema,
  ProductGridBlockSchema,
  TestimonialsBlockSchema,
  WhatsappCtaBlockSchema,
  ContactFormBlockSchema,
  SpacerBlockSchema,
]);

export type PageBlock = z.infer<typeof PageBlockSchema>;
