const m = 3; // The maximum keys for each node - if the amount hits 3, the tree splits

let btree = { // This will be considered the root node
	key: [],
	payload: [],
	children: []
};

/* IMPORTANT NOTES:
		-> 0 is the first child (within children) - each node position in the list is the same as the value that
		is to the "left" of them
*/

function find_parent_object(b_tree, key, compare_level, level) {
	if (compare_level == 0) return 0; // This is the root node
	// look at current level and compare to what level we need to be on
	if (level == compare_level - 1) return b_tree;
	// Otherwise keep going down in levels
	// ^ First need to know which subtree to go in
	let child_pos = 0;
	for (bkey in b_tree.key) {
		child_pos += key > b_tree.key[bkey] ? 1 : 0;
	}
	return find_parent_object(b_tree.children[child_pos], key, compare_level, level + 1);
}

function quicksort(array, payload, low, high) {
	if (low < high) {
		let pivot = partition(array, payload, low, high);
		quicksort(array, payload, low, pivot - 1); // low side
		quicksort(array, payload, pivot + 1, high); // high side
	}
	return [array, payload];
}

function partition(array, payload, startlow, pivot) {
	let lowest = startlow - 1;
	let buffer;
	for (let j = startlow; j < pivot; j++) {
		if (array[j] < array[pivot]) {
			lowest++;
			buffer = array[j];
			array[j] = array[lowest];
			array[lowest] = buffer;
			// swap payload values
			buffer = payload[j];
			payload[j] = payload[lowest];
			payload[lowest] = buffer;
		}
	}
	buffer = array[lowest + 1];
	array[lowest + 1] = array[pivot];
	array[pivot] = buffer;
	// swap payload values
	buffer = payload[lowest + 1];
	payload[lowest + 1] = payload[pivot];
	payload[pivot] = buffer;
	return lowest + 1;
}

function split_node(b_tree) {
	let parent_pos = Math.floor(m / 2);
	let parent_key = b_tree.key[parent_pos];
	let parent_payload = b_tree.payload[parent_pos];
	let left_keys = b_tree.key.splice(0, parent_pos);
	let left_payloads = b_tree.payload.splice(0, parent_pos);
	let left_children = b_tree.children.splice(0, parent_pos + 1);
	let right_keys = b_tree.key.splice(parent_pos, m - (parent_pos - 1));
	let right_payloads = b_tree.payload.splice(parent_pos, m - (parent_pos - 1));
	let right_children = b_tree.children.splice(parent_pos - 1, m - (parent_pos - 1));
	b_tree.key = [parent_key];
	b_tree.payload = [parent_payload];
	b_tree.children[0] = {
		key: left_keys,
		payload: left_payloads,
		children: left_children
	};
	b_tree.children[1] = {
		key: right_keys,
		payload: right_payloads,
		children: right_children
	};
	return;
}

function insert(b_tree, key, value, depth) {
	depth = !depth ? 0 : depth;
	let key_pos = 0;
	let combine_compare = false; // Knowing if there is a need to combine the child up in the parent
	for (let run_through = 0; run_through < b_tree.key.length; run_through++) {
		if (key > b_tree.key[run_through]) key_pos++;
	}
	if (b_tree.children && b_tree.children[key_pos]) {
		combine_compare = insert(b_tree.children[key_pos], key, value, depth + 1);
	} else {
		// insert here and start fixing the tree upward
		b_tree.key.push(key);
		b_tree.payload.push(value);
		quicksort(b_tree.key, b_tree.payload, 0, b_tree.key.length - 1);
		if (b_tree.key.length == m) {
			split_node(b_tree);
			return true;
		}
	}
	if (!combine_compare) return false;
	// Pull up the child into the parent
	b_tree.key.push(b_tree.children[key_pos].key[0]);
	b_tree.payload.push(b_tree.children[key_pos].payload[0]);
	quicksort(b_tree.key, b_tree.payload, 0, b_tree.key.length - 1);
	let right_children = b_tree.children[key_pos].children[1];
	b_tree.children[key_pos] = b_tree.children[key_pos].children[0];
	while (b_tree.children[key_pos + 1]) {
		let buffer = b_tree.children[key_pos + 1];
		b_tree.children[key_pos + 1] = right_children;
		right_children = buffer;
		key_pos++;
	}
	b_tree.children[key_pos + 1] = right_children;
	if (b_tree.key.length == m) {
		split_node(b_tree);
		return true;
	}
	return false;
}

insert(btree, 1, 4230);
insert(btree, 2, 36);
insert(btree, 3, 47);
insert(btree, 4, 816);
insert(btree, 5, 4230);
insert(btree, 6, 36);
insert(btree, 7, 47);
insert(btree, 8, 816);

function search(b_tree, key) {
	let key_pos = 0;
	for (let i = 0; i < b_tree.key.length; i++) { // search through keys and see which child should be traversed to
		if (key == b_tree.key[i]) return b_tree;
		if (key > b_tree.key[i]) key_pos++;
	}
	if (typeof b_tree.children[key_pos] != "undefined") return search(b_tree.children[key_pos], key);
	return "No value found";
}

function update(b_tree, key, value) {
	let key_pos = -1;
	for (let bkey = 0; bkey < b_tree.key.length; bkey++) { // See if there's a key within the tree that matches the key
		if (key == b_tree.key[bkey]) { // When key_pos != -1, we need to remove something
			key_pos = bkey;
			break;
		} else if (key > b_tree.key[bkey]) {
			key_pos = bkey + 1;
		}
		key_pos = b_tree.key.length - 1 == bkey && key_pos == -1 ? 0 : key_pos;
	}
	if (b_tree.key[key_pos] != key) {
		if (b_tree.children[key_pos]) update(b_tree.children[key_pos], key, value);
		return "No value to update";
	}
	b_tree.payload[key_pos] = value;
	return;
}

function deletion(b_tree, key, depth, gparent) {
	depth = !depth ? 0 : depth;
	let curr_key = gparent ? gparent : key;
	let key_pos = 0;
	for (let i = 0; i < b_tree.key.length; i++) {
		if (b_tree.key[i] == curr_key) {
			key_pos = i;
			break;
		}
		key_pos = b_tree.key[i] < curr_key ? i + 1 : i;
	}
	let new_values;
	// check if we should delete
	if (b_tree.key[key_pos] == curr_key && b_tree.children[key_pos] && b_tree.children[key_pos].children.length) {
		gparent = curr_key - 1;
		new_values = deletion(b_tree.children[key_pos], key, depth + 1, gparent);
	} else if (b_tree.key[key_pos] == curr_key || (gparent && !b_tree.children[key_pos])) {
		let kill_pos = (gparent && !b_tree.children[key_pos]) ? b_tree.key.length - 1 : key_pos;
		let key = b_tree.key.splice(kill_pos, 1)[0];
		let pay = b_tree.payload.splice(kill_pos, 1)[0];
		if (gparent && !b_tree.children[key_pos]) return [key, pay];
		return;
	} else { // keep searching
		if (!b_tree.children[key_pos]) return 0;
		new_values = deletion(b_tree.children[key_pos], key, depth + 1, gparent);
	}
	// run a quick check on the lengths of the children
	let full_children = true;
	for (let children_check = 0; children_check < b_tree.children.length; children_check++) {
		if (!b_tree.children[children_check].key.length) {
			full_children = false;
			break;
		}
	}
	if (full_children) return new_values;
	console.log("\nfull tree", b_tree, b_tree.children, "\n");
	// make a full node and empty node variable to keep track
	let full_node = b_tree.children[key_pos].key.length ? key_pos : key_pos + 1;
	let empty_node = !b_tree.children[key_pos].key.length ? key_pos : key_pos + 1;
	// since the value may be on the other side, check on the right
	full_node = b_tree.children[full_node] && b_tree.children[full_node].key.length ? full_node : key_pos - 1;
	empty_node = b_tree.children[empty_node] && b_tree.children[empty_node].key.length == 0 ? empty_node : key_pos - 1;
	let parent_key;
	let parent_load;
	if (b_tree.children[full_node].key.length > 1) {
		// first case: one child is empty, other has multiple values
		// ^: parent goes to empty node, inner vlaue on full node goes to parent
		parent_key = b_tree.key[empty_node];
		parent_load = b_tree.payload[empty_node];
		b_tree.key[empty_node] = full_node > key_pos ? b_tree.children[full_node].key.splice(0, 1)[0] :
			b_tree.children[full_node].key.splice(b_tree.children[full_node].key.length - 1, 1)[0];
		b_tree.payload[empty_node] = full_node > key_pos ? b_tree.children[full_node].payload.splice(0, 1)[0] :
			b_tree.children[full_node].payload.splice(b_tree.children[full_node].payload.length - 1, 1)[0];
		b_tree.children[empty_node].key = parent_key;
		b_tree.children[empty_node].payload = parent_load;

	} else if (b_tree.children[full_node].key.length == 1) {
		// second case: one is empty, other has one
		// ^: parent combines with full nodde as a child, parent left empty, child empty node deleted
		parent_key = b_tree.key.splice(empty_node, 1);
		parent_load = b_tree.payload.splice(empty_node, 1);
		b_tree.children[full_node].key = full_node > key_pos ?
		parent_key.concat(b_tree.children[full_node].key) :
		[...b_tree.children[full_node].key, ...parent_key];
		b_tree.children[full_node].payload = full_node > key_pos ?
		parent_load.concat(b_tree.children[full_node].payload) :
		[...b_tree.children[full_node].payload, ...parent_load];
		if (b_tree.children[empty_node].children[0] && b_tree.children[empty_node].children[0].key.length) {
			b_tree.children[full_node].children = full_node > key_pos ?
			b_tree.children[empty_node].children.concat(b_tree.children[full_node].children) :
			[...b_tree.children[full_node].children, ...b_tree.childen[empty_node].children];
		}
		b_tree.children.splice(empty_node, 1);
	}
	if (depth == 0 && b_tree.key.length == 0) {
		// final case: root node and no keys
		// ^: tak child node and adopt it up into the root
		b_tree.key = b_tree.children[0].key;
		b_tree.payload = b_tree.children[0].payload;
		b_tree.children = b_tree.children[0].children;
	}
	return new_values;
}

deletion(btree, 5);
console.log("one", JSON.stringify(btree));
deletion(btree, 1);
console.log("two", JSON.stringify(btree));
deletion(btree, 7);
console.log("three", JSON.stringify(btree));

module.exports = {
	btree,
	insert,
	deletion
}