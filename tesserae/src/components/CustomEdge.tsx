import React from "react";
import {
	getBezierPath,
	Position,
} from "reactflow";

// Define our own props interface with only what we need
interface CustomEdgeProps {
	id: string;
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	sourcePosition: Position; // Use Position enum instead of any
	targetPosition: Position; // Use Position enum instead of any
	style?: React.CSSProperties;
	data?: {
		properties?: {
			type?: string;
		};
	};
	markerEnd?: string;
}

const CustomEdge: React.FC<
	CustomEdgeProps
> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	data,
	markerEnd,
}) => {
	const [edgePath] =
		getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition,
		});

	const edgeType =
		data?.properties
			?.type || "default";

	let strokeColor = "#555";
	let strokeWidth = 1.5;
	let strokeDasharray =
		"none";

	// Style based on connection type
	switch (edgeType) {
		case "trigger":
			strokeColor =
				"#ff9900";
			strokeWidth = 2;
			strokeDasharray =
				"5,5";
			break;
		case "collision":
			strokeColor =
				"#ff0000";
			strokeWidth = 3;
			break;
		case "pickup":
			strokeColor =
				"#00ff00";
			strokeWidth = 2;
			break;
		default:
			strokeColor = "#555";
	}

	return (
		<path
			id={id}
			style={{
				strokeWidth,
				stroke:
					strokeColor,
				strokeDasharray,
				...style,
			}}
			className="react-flow__edge-path"
			d={edgePath}
			markerEnd={markerEnd}
		/>
	);
};

export default CustomEdge;
