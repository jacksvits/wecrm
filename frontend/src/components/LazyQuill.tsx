import { lazy, Suspense, forwardRef, ComponentProps } from 'react'
import 'react-quill-new/dist/quill.snow.css'

// Ленивый WYSIWYG-редактор: quill (~250 КБ min) грузится отдельным чанком
// в момент открытия редактора, а не вместе с первым экраном приложения
const ReactQuillLazy = lazy(() => import('react-quill-new'))

type ReactQuillProps = ComponentProps<typeof ReactQuillLazy>

const ReactQuillInner = forwardRef<any, ReactQuillProps>((props, ref) => (
  <ReactQuillLazy {...props} ref={ref} />
))

export default forwardRef<any, ReactQuillProps>(function ReactQuill(props, ref) {
  return (
    <Suspense fallback={<div style={{ minHeight: 120 }} />}>
      <ReactQuillInner {...props} ref={ref} />
    </Suspense>
  )
})
