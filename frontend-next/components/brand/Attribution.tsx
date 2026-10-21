import { NexoraLogo } from '@/components/brand/BrandMark';
import RichInline from '@/components/brand/RichInline';

/** "Powered by" line: rich text from the Console followed by the Nexora logo. */
export default function Attribution({ html, logoHeight, className, testId = 'powered-by' }: {
  html: string; logoHeight: number; className: string; testId?: string;
}) {
  return (
    <div className={className} data-testid={testId}>
      {html && <span><RichInline html={html} /></span>}
      <NexoraLogo height={logoHeight} />
    </div>
  );
}
