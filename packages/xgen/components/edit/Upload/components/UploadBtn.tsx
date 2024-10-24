import clsx from 'clsx'
import type { IPropsUploadBtn } from '../types'
import { Icon } from '@/widgets'

const Index = (props: IPropsUploadBtn) => {
	const { filetype, placeholder, placeholderIcon } = props
	const iconProps = {
		name: typeof placeholderIcon === 'string' ? placeholderIcon : placeholderIcon?.name || 'cloud-upload',
		size: typeof placeholderIcon === 'string' ? 14 : placeholderIcon?.size || 14
	}
	return (
		<div className={clsx(['btn_upload_wrap flex align_center cursor_point', filetype])}>
			<Icon {...iconProps} />
			<span className='desc'>{placeholder}</span>
		</div>
	)
}

export default window.$app.memo(Index)
