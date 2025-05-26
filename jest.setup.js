// AudioContextのモック
global.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: () => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: ''
    }),
    createGain: () => ({
        connect: jest.fn(),
        gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn()
        }
    }),
    destination: {}
}));

global.webkitAudioContext = global.AudioContext;