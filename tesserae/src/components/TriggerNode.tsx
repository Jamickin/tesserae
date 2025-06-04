import React, {
	memo,
} from "react";
import {
	Handle,
	Position,
	type NodeProps,
} from "reactflow";

function TriggerNode({
	data,
}: NodeProps) {
	return (
		<div className="custom-node trigger">
			<Handle
				type="target"
				position={
					Position.Top
				}
				className="custom-handle"
			/>
			<div className="title">
				⚡ {data.label}
			</div>
			<div>
				Type:{" "}
				{data.properties
					?.activation ||
					"Proximity"}
			</div>
			<div>
				One-Time:{" "}
				{data.properties
					?.oneTime
					? "Yes"
					: "No"}
			</div>
			<Handle
				type="source"
				position={
					Position.Bottom
				}
				className="custom-handle"
			/>
		</div>
	);
}

export default memo(
	TriggerNode
);
