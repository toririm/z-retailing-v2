import { dayjsJP } from "~/utils/dayjs";

export const anonUserNames = () => {
	const today = dayjsJP().tz();
	// 毎月異なる順番でシャッフルする
	const seed = today.year() * today.month();
	const rand = new RandXor(seed);
	const shuffledNames = [...names].sort(() => rand.next());
	return shuffledNames;
};
const names = [
	"ゴン",
	"キルア",
	"クラピカ",
	"レオリオ",
	"ヒソカ",
	"クロロ",
	"ノブナガ",
	"フェイタン",
	"シズク",
	"浅草氏",
	"金森氏",
	"水崎ツバメ",
	"碇シンジ",
	"綾波レイ",
	"アスカ",
	"渚カヲル",
	"葛城ミサト",
	"冬月",
	"赤木リツコ",
	"加持リョウジ",
	"葛城ミサト",
	"碇ゲンドウ",
	"大豆田とわ子",
	"岸部露伴",
	"青たぬき",
	"コナンくん",
	"蘭姉ちゃん",
	"服部平次",
	"灰原哀",
	"毛利小五郎",
	"目暮警部",
	"園子",
	"しずかちゃん",
	"光彦",
	"コロ助",
	"ルパン",
	"次元大介",
	"不二子",
	"銭形警部",
	"五ェ門",
	"鬼太郎",
	"ねずみ男",
	"猫娘",
	"目玉おやじ",
];

// seedに対して一意の乱数を生成するクラス
class RandXor {
	x: number;
	y: number;
	z: number;
	w: number;
	constructor(seed: number) {
		this.x = 123456789;
		this.y = 362436069;
		this.z = 521288629;
		this.w = seed;
	}

	next(): number {
		const t = this.x ^ (this.x << 11);
		this.x = this.y;
		this.y = this.z;
		this.z = this.w;
		this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8));
		return this.w;
	}
}
