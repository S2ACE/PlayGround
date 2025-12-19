import { forwardRef, type Ref, type ReactElement } from 'react';
import { Slide } from '@mui/material';
import { type TransitionProps } from '@mui/material/transitions';

const SlideTransition = forwardRef(function Transition(
	props: TransitionProps & {
		children: ReactElement<any, any>;
	},
	ref: Ref<unknown>,
) {
	return <Slide direction="up" ref={ref} {...props} />;
});

export default SlideTransition;
