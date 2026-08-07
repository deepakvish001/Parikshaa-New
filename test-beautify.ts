import beautify from 'js-beautify';

const code = `int main(){string line;getline(cin,line);stringstream ss(line);vector<int> nums;int x;while(ss>>x)nums.push_back(x);int target;cin>>target;cout<<last_index(nums,target)<<endl;}`;

console.log(beautify.js(code, { indent_size: 4 }));
