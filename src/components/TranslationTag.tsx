import { Skeleton } from './Skeleton'

/** The translation of the text on screen, taken from the response that served
    it rather than the account preference. Null shows a placeholder. */
export default function TranslationTag({ code }: { code: string | null }) {
  if (code === null) return <Skeleton variant='chip' w={44} h={22} />
  return (
    <span className='translation-tag' aria-label={`${code} translation`}>
      {code}
    </span>
  )
}
